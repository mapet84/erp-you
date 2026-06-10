# Checklist de paso a producción — ERP YOU · Fase 1

Portal de autofacturación CFDI 4.0. La Fase 1 está **completa y verificada contra
servicios reales** (Facturama **sandbox** + Resend), pero corre con datos y cuentas de
prueba. Este documento lista lo que falta para operar con **valor fiscal real**.

Leyenda: ✅ listo · ⬜ pendiente · ⚠️ riesgo/gap conocido a cerrar antes de producción.

> Estado al 2026-06-10: app funcional end-to-end en sandbox; **no apta para timbrar con
> valor fiscal todavía**. Bloqueantes principales: cuenta/CSD productivos de Facturama,
> dominio de correo, despliegue con TLS, rate-limiting y respaldos.

---

## 1. Facturama — producción

- ⬜ Crear **cuenta de producción** de Facturama API Multiemisor (independiente de la sandbox) y contratar la suscripción/timbres.
- ⬜ Cargar el **CSD real** del emisor (no el de pruebas `EKU9003173C9`) vía `npm run emisor:alta` apuntando a producción.
- ⬜ Cambiar `FACTURAMA_ENV=production` y poner las credenciales productivas en el gestor de secretos (no en `.env` versionado).
- ⬜ Dar de alta cada emisor con su **razón social EXACTA del padrón** (sin "SA DE CV"); ya validado como causa de rechazo en CFDI 4.0.
- ⬜ Prueba de humo en producción con un timbrado real de monto bajo y su **cancelación** (validar que el flujo productivo responde).
- ⚠️ La **cancelación de CFDI** no está implementada (no es parte de F1). Definir proceso manual o slice nuevo antes de operar.
- ✅ Contrato del cliente verificado: `POST api-lite/csds`, `POST api-lite/3/cfdis`, `GET cfdi/{xml,pdf}/issuedLite/{id}`.
- ✅ Idempotencia de alta de CSD (`ensureCsd`) y de timbrado por `(emisorId, folioTicket)`.

## 2. Correo (Resend) — producción

- ⬜ **Verificar un dominio propio** en Resend (registros SPF/DKIM/DMARC) para un remitente con marca.
- ⬜ Cambiar `EMAIL_FROM` de `onboarding@resend.dev` (pruebas, sólo entrega al dueño de la cuenta) al remitente del dominio verificado.
- ⚠️ **Rotar la `RESEND_API_KEY`** actual: se compartió en texto plano. Generar una nueva y guardarla en el gestor de secretos.
- ⬜ Revisar límites de envío del plan de Resend vs. volumen esperado.
- ✅ Adaptador `email/*` best-effort: un fallo de correo no invalida el timbrado ni la descarga; queda registrado en `Invoice.correoError`.

## 3. Base de datos

- ⬜ Postgres **gestionado/productivo** (no el `docker-compose` de dev con credenciales `erpyou/erpyou`).
- ⬜ Credenciales fuertes y `DATABASE_URL` desde el gestor de secretos; `sslmode=require`.
- ⬜ **Respaldos automáticos** + prueba de restauración. Crítico: el XML es documento fiscal con obligación de conservación (≈5 años).
- ⬜ Aplicar migraciones con `npm run db:migrate` (`prisma migrate deploy`), nunca `migrate dev`, en el pipeline de release.
- ⬜ Definir límites de conexión / pgbouncer si se escala (Prisma abre un pool por instancia).
- ⚠️ XML/PDF se guardan como **bytea** en Postgres. Suficiente para F1; revisar tamaño/Бackups si el volumen crece (alternativa: object storage).
- ✅ Esquema con `@@unique` para anti-duplicado; `InvoiceFile` y `CatalogoSat` sembrados.
- ⚠️ Prisma fijado a **v6** (v7 exige `prisma.config.ts` + driver adapter). Migración diferida; no bloquea producción.

## 4. Despliegue e infraestructura

- ⬜ **Dockerfile** de la app Next.js (hoy `docker-compose.yml` sólo levanta Postgres; el dev corre `next dev` local).
- ⬜ Build productivo (`next build` + `next start`) detrás de un **reverse proxy** (Caddy/Nginx/Traefik).
- ⬜ **TLS/HTTPS obligatorio** (se manejan RFC, correo y datos fiscales).
- ⬜ Dominio público + DNS para el portal.
- ⬜ Variables de entorno inyectadas por el orquestador (no archivo `.env` en la imagen).
- ⬜ `/healthcheck` (no existe ruta `/api`): agregar un endpoint de salud para el balanceador/monitor.
- ⬜ Estrategia de despliegue (zero-downtime / migración antes de arrancar la nueva versión).

## 5. Seguridad

- ⚠️ **Rate-limiting ausente** en el formulario público (`emitirFactura`). Un bot podría disparar timbrados y consumir folios/saldo de Facturama. **Bloqueante**: agregar límite por IP + por emisor antes de exponer.
- ⚠️ La ruta de descarga `GET /factura/[invoiceId]/[tipo]` **no tiene auth**: cualquiera con el `invoiceId` (cuid) baja XML/PDF con datos fiscales. cuid es difícil de adivinar pero es PII. Considerar token firmado/expirable o enlace por correo.
- ⬜ Cabeceras de seguridad (CSP, HSTS, X-Content-Type-Options) en el proxy o `next.config`.
- ⬜ Protección anti-bot en el formulario (captcha/turnstile) dado que es público.
- ⬜ Gestor de secretos real; quitar credenciales de `.env` de las máquinas de desarrollo compartidas.
- ⬜ Revisar logs para no filtrar PII/credenciales.
- ✅ Validación de entrada con Zod (formato RFC 12/13, CP, catálogos) antes de llamar al PAC.
- ✅ Server Actions sólo aceptan POST; la validación + anti-abuso (folio único, ventana) son la barrera de negocio.
- ✅ `.env` y `csd/` en `.gitignore`; el material CSD no se commitea.

## 6. Cumplimiento legal / fiscal (México)

- ⬜ **Aviso de privacidad** (LFPDPPP) visible en el portal: se recaban RFC, nombre y correo (datos personales).
- ⬜ Términos y condiciones del servicio de autofacturación.
- ✅ **Conservación del XML** (y PDF) en BD, independiente del PAC — cubre la obligación de resguardo.
- ⚠️ Definir política de **retención** y borrado conforme a la normativa (conservación fiscal vs. derechos ARCO).
- ⚠️ Confirmar manejo correcto del **uso CFDI / régimen** del receptor para casos reales (la lista de catálogos es un subconjunto curado; ampliarla si el negocio lo requiere).

## 7. Confiabilidad y reintentos

- ⚠️ **Reintento de correo**: `Invoice.correoError` se registra, pero **no hay job** que reintente envíos fallidos. Agregar tarea/cron.
- ⚠️ **Reintento de archivos**: si falla `getXml/getPdf`, el `Invoice` queda timbrado pero sin archivo; falta job de reintento de descarga/conservación.
- ⬜ **Timeouts/retries** hacia Facturama (hoy un `fetch` directo sin timeout explícito ni reintento de red).
- ⬜ Manejo de doble-submit en la UI (el botón se deshabilita con `pending`; validar que no haya carrera con la red).
- ✅ Idempotencia de timbrado: un folio ya timbrado no re-timbra; un folio en `error` sí se reintenta.
- ✅ Errores del PAC traducidos a mensajes accionables (`pac-errors.ts`) con `Invoice` en estatus `error`.

## 8. Observabilidad

- ⬜ **Logging estructurado** (hoy `console`/silencioso en los `catch` best-effort).
- ⬜ **Error tracking** (Sentry o similar) en la Server Action y el cliente Resend/Facturama.
- ⬜ Métricas/alertas: tasa de rechazos del PAC, fallos de correo, latencia de timbrado, saldo de timbres.
- ⬜ Dashboard/consulta de soporte más allá del CLI `npm run facturas:list`.

## 9. QA y pruebas

- ✅ **91 pruebas unitarias** verdes (tax, cfdi-builder, billing-rules, facturama-client, pac-errors, email).
- ⬜ Pruebas de integración/e2e automatizadas del flujo de portal (hoy verificado manualmente con scripts smoke).
- ⬜ Prueba de carga ligera del endpoint público (anti-abuso/rate-limit).
- ⬜ Checklist de QA manual en producción-sandbox antes del go-live (cada combinación receptor/uso/forma de pago relevante).

## 10. Operación

- ✅ Alta de emisor por **CLI** (`npm run emisor:alta`) — sin panel admin en F1.
- ✅ Consulta read-only de facturas (`npm run facturas:list -- --slug <slug>`).
- ⬜ **Runbook**: cómo dar de alta un emisor en prod, rotar CSD vencido, reintentar correos, restaurar respaldo.
- ⬜ Procedimiento ante **CSD vencido** (los de prueba vencen 2027; los reales tienen su propia vigencia) — alertar y recargar.
- ⬜ Contacto/soporte para clientes cuyo timbrado es rechazado por datos que no coinciden con su CSF.

---

## Bloqueantes mínimos para go-live (resumen)

1. **Facturama producción** + CSD real del emisor + suscripción de timbres. (§1)
2. **Rate-limiting** en el formulario público. (§5) — sin esto, riesgo de consumo de saldo.
3. **TLS/HTTPS + despliegue** real (Dockerfile + proxy + dominio). (§4)
4. **Respaldos de BD** probados (obligación de conservación fiscal). (§3)
5. **Dominio de correo verificado** + **rotar la API key** expuesta. (§2)
6. **Aviso de privacidad** y términos. (§6)
7. **Auth/token** en la ruta de descarga de XML/PDF. (§5)

## Diferible tras el go-live

- Reintentos automáticos de correo/archivos (§7), observabilidad completa (§8), e2e
  automatizado (§9), panel admin y migración a Prisma v7 (§3), cancelación de CFDI (§1).
