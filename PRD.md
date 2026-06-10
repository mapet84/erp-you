# PRD — ERP YOU · Fase 1: Portal de Autofacturación CFDI 4.0

> Este documento es el PRD de la Fase 1. Al crear el proyecto en `Desktop\Claude\erp-you`,
> este contenido se copia como `PRD.md` raíz para el flujo `ralph.ps1` (PRD.md + progress.txt).
> Tracker de issues: no configurado todavía (greenfield) — se gestiona vía PRD.md/progress.txt.

## Context

Estamos construyendo **ERP YOU**, un ERP para restaurantes, cafeterías, panaderías,
pastelerías y negocios con inventario mediano y ciclo de producción. El proyecto se
construye por fases. **Esta es la Fase 1** y cubre la última parte del proceso de negocio:
la **facturación al cliente final**.

Hoy, cuando un cliente consume en uno de estos negocios y necesita factura, depende de un
proceso manual o de portales de terceros. Queremos un **portal web de autofacturación**
propio donde el cliente final, con los datos de su ticket y su información fiscal, obtenga
un **CFDI 4.0 timbrado y válido ante el SAT** (PDF + XML), sin intervención del personal.

El repo de la Fase 1 es además la **base del futuro ERP**, por lo que se diseña multi-tenant
por RFC desde el inicio aunque arranque con un solo emisor.

## Problem Statement

Como cliente de un restaurante/cafetería/panadería, después de consumir necesito mi factura
fiscal y no tengo una forma sencilla y autónoma de obtenerla: dependo de que el personal la
genere, de horarios, o de portales externos confusos. Quiero entrar a un sitio, capturar el
folio de mi ticket y mis datos fiscales, y recibir mi factura válida al instante.

Como dueño del negocio (emisor), necesito ofrecer autofacturación sin exponer mi RFC a que
cualquiera genere facturas de ingreso arbitrarias contra mi empresa, conservar el XML por los
5 años que exige la ley, y poder reutilizar la misma plataforma para varias de mis empresas.

## Solution

Un portal web público (Next.js + TypeScript) donde cada emisor vive en una ruta por slug
(`/f/[slug]`). El cliente final:

1. Entra al portal del emisor.
2. Captura el **candado anti-abuso**: folio del ticket + fecha + monto total (con IVA).
3. Captura sus **datos fiscales** (RFC, Nombre/razón social, CP, Régimen Fiscal, Uso CFDI,
   Forma de Pago, correo).
4. El sistema desglosa IVA, arma el CFDI 4.0 con un **concepto genérico configurado por el
   emisor**, lo **timbra vía Facturama (API Multiemisor)**, lo persiste y se lo entrega:
   pantalla de éxito con descarga de **XML + PDF** y envío por **correo (Resend)**.

El timbrado se hace a través de **Facturama** (PAC), no contra el SAT directamente: el portal
arma y sella el CFDI con el **CSD** del emisor (cargado en Facturama), Facturama lo timbra y le
asigna el folio fiscal (UUID).

## User Stories

### Cliente final (receptor)
1. Como cliente final, quiero entrar al portal de facturación del negocio por una URL simple, para empezar mi factura sin instalar nada.
2. Como cliente final, quiero capturar el folio, la fecha y el monto total de mi ticket, para identificar la venta que voy a facturar.
3. Como cliente final, quiero capturar mi RFC, para que la factura salga a mi nombre fiscal.
4. Como cliente final, quiero capturar mi razón social/nombre tal como está en mi Constancia de Situación Fiscal, para que el SAT no rechace la factura.
5. Como cliente final, quiero capturar mi código postal (domicilio fiscal), para cumplir el requisito de CFDI 4.0.
6. Como cliente final, quiero elegir mi Régimen Fiscal de una lista, para no tener que memorizar la clave.
7. Como cliente final, quiero elegir el Uso de CFDI de una lista, para clasificar correctamente mi gasto.
8. Como cliente final, quiero indicar la Forma de Pago con que pagué, para que el comprobante refleje cómo pagué.
9. Como cliente final, quiero capturar mi correo, para recibir ahí mi factura.
10. Como cliente final, quiero ver el desglose (subtotal, IVA, total) antes de confirmar, para verificar que coincide con mi ticket.
11. Como cliente final, quiero recibir un mensaje claro si mis datos no coinciden con el SAT (RFC/Nombre/CP/Régimen), para corregirlos y reintentar.
12. Como cliente final, quiero ver una pantalla de éxito con botones de descarga de XML y PDF, para guardar mi factura al instante.
13. Como cliente final, quiero recibir el XML y el PDF también por correo, para tener respaldo aunque cierre la pestaña.
14. Como cliente final, quiero que el sistema me impida facturar dos veces el mismo folio, para no duplicar mi factura.
15. Como cliente final, quiero un aviso claro si la fecha de mi ticket ya quedó fuera de la ventana de facturación, para entender por qué no puedo facturar.
16. Como cliente final con persona física, quiero que el formulario acepte un RFC de 13 caracteres, y como persona moral uno de 12, para que ambos casos funcionen.

### Emisor / operador del ERP
17. Como operador, quiero dar de alta un emisor mediante un script/CLI que sube su CSD a Facturama y crea su registro, para no construir un panel admin en Fase 1.
18. Como operador, quiero configurar por emisor su concepto genérico (descripción, ClaveProdServ, ClaveUnidad, tasa de IVA), para que las facturas usen el concepto correcto.
19. Como operador, quiero configurar por emisor su CP de expedición, régimen fiscal emisor y datos de marca/slug, para personalizar su portal.
20. Como operador, quiero configurar la ventana de facturación por emisor (default: mismo mes calendario), para alinearla con su política.
21. Como operador, quiero que el sistema conserve el XML y el PDF de cada CFDI, para cumplir la obligación legal de conservación 5 años.
22. Como operador, quiero que el folio del ticket sea único por emisor, para evitar facturas duplicadas contra mi RFC.
23. Como operador, quiero que la plataforma soporte varios emisores (RFCs) bajo una sola cuenta Facturama Multiemisor, para reutilizarla en mis distintas empresas.
24. Como operador, quiero ver/consultar las facturas emitidas y su estatus en la base de datos, para auditar y dar soporte.
25. Como operador, quiero que las credenciales de Facturama, Resend y la BD vivan en variables de entorno/secretos, para no exponerlas en el código.

### Sistema / cumplimiento
26. Como sistema, quiero desglosar el IVA reconciliando centavos para que subtotal + IVA = total exacto, para que el PAC no rechace por descuadre de centavos.
27. Como sistema, quiero fijar `MetodoPago=PUE`, `TipoComprobante=I`, `Moneda=MXN`, `Exportacion=01`, `ObjetoImp=02`, para emitir un CFDI de ingreso de contado correcto.
28. Como sistema, quiero validar formato de RFC, CP y pertenencia a catálogos antes de llamar al PAC, para fallar rápido y barato.
29. Como sistema, quiero mapear y traducir los errores del PAC a mensajes en español entendibles, para guiar la corrección del usuario.
30. Como sistema, quiero evitar timbrar dos veces por doble clic/reintento (idempotencia + folio único), para no gastar timbres ni emitir duplicados.

## Implementation Decisions

### Decisiones de producto/alcance (definidas en grilling)
- **PAC:** Facturama, **API Multiemisor** (un emisor hoy, varios RFCs después). Una sola cuenta Facturama; CSD por RFC cargado en Facturama.
- **Stack:** Next.js (App Router) + TypeScript. **Prisma** sobre **Postgres**, **Tailwind + shadcn/ui**, **Zod**.
- **Multi-tenant por slug:** cada emisor en `/f/[slug]`; diseño abierto a dominios propios en fase posterior.
- **Alta de emisor:** script/CLI de seed (sin panel admin en F1) que sube CSD a Facturama y crea el registro del emisor.
- **Conceptos:** un **concepto genérico configurable por emisor** (ClaveProdServ, ClaveUnidad, IVA 16%); el monto total entra en ese único concepto.
- **Monto/IVA:** el cliente captura el **total con IVA**; el sistema desglosa subtotal e IVA con reconciliación de centavos.
- **Datos receptor:** formulario completo (RFC, Nombre, CP, Régimen, Uso CFDI, Forma de Pago, correo); validación de formato en front + manejo claro de rechazos del PAC. (Autollenado por RFC y OCR de Constancia: **fuera de alcance**.)
- **Anti-abuso (F1):** captura de folio+fecha+monto; **folio único por emisor** (1 factura por folio) + **fecha dentro de la ventana**. Validación del monto contra venta real llega en Fase 2 (no hay feed de ventas aún) — el monto se registra para auditoría.
- **Ventana de facturación:** **mismo mes calendario**, configurable por emisor.
- **Persistencia:** **metadata + XML + PDF**; archivos como **bytea en Postgres**.
- **Entrega:** pantalla de éxito con descarga + envío por correo (**Resend**, dominio propio).
- **Deploy:** self-host con **Docker** en VPS (Next.js + Postgres en contenedores). Dev local con Docker.
- **Sin login** para el cliente final; el portal es público.

### Módulos (buscando módulos profundos y puros)
- **`tax`** (profundo, puro): desglose IVA y reconciliación de centavos a partir del total. Sin dependencias.
- **`cfdi-builder`** (profundo, puro): construye el payload CFDI 4.0 Multiemisor desde config de emisor + receptor + monto + concepto; aplica defaults fijos y traslado de IVA; usa `tax`.
- **`billing-rules`** (profundo, puro): regla de ventana mismo-mes (configurable) + validaciones de formato (RFC 12/13, CP 5 dígitos, pertenencia a catálogos) vía Zod.
- **`facturama-client`** (adaptador): wrapper de la API Multiemisor (auth Basic, `createCfdi`, `getPdf`/`getXml` base64, `uploadCsd`/`createIssuer`), switch sandbox/prod por entorno.
- **`invoice-service`** (orquestador): valida → checa candado (folio único + ventana) → arma payload → timbra → persiste (metadata + XML/PDF) → envía correo; idempotencia anti doble-timbrado.
- **`email-sender`** (adaptador): Resend con plantilla y adjuntos XML/PDF.
- **`persistence`** (adaptador Prisma): emisores, facturas, archivos, catálogos.
- **Scripts:** seed de catálogos curados (c_RegimenFiscal, c_UsoCFDI, c_FormaPago) + CLI de alta de emisor.

### Esquema (Prisma/Postgres) — alto nivel
- **Emisor**: id, slug, rfc, razónSocial, regimenFiscal, cpExpedicion, marca/branding, conceptoDefault (claveProdServ, claveUnidad, descripción, tasaIva), ventanaFacturacion, facturamaIssuerRef, activo.
- **Invoice**: id, emisorId, folioTicket, fechaTicket, montoTotalCapturado, subtotal, iva, total, receptor (rfc, nombre, cp, regimenFiscal, usoCfdi, email), formaPago, estatus (pendiente/timbrada/error), uuid, facturamaCfdiId, errorPac, createdAt. **Único: (emisorId, folioTicket).**
- **InvoiceFile**: id, invoiceId, tipo (xml/pdf), contenido (bytea), contentType.
- **Catalog** (o tablas por catálogo): clave, descripción, tipo (regimenFiscal/usoCfdi/formaPago), filtros aplicables (p.ej. persona física/moral, régimen→usos válidos).

### Contrato CFDI 4.0 (campos fijos vs. capturados)
- **Fijos/derivados:** `TipoDeComprobante=I`, `MetodoPago=PUE`, `Moneda=MXN`, `Exportacion=01`, `LugarExpedicion`=CP emisor, `ObjetoImp=02`, traslado IVA 16%, `Fecha`=emisión (ahora), concepto = default del emisor.
- **Capturados receptor:** `Rfc`, `Nombre`, `DomicilioFiscalReceptor` (CP), `RegimenFiscalReceptor`, `UsoCFDI`.
- **Capturados comprobante:** `FormaPago`, `Folio`/`Serie` (a partir del folio del ticket o secuencia interna), importe (de `tax`).

### Flujo de timbrado (invoice-service)
1. Validar payload (Zod) y candado (`billing-rules`): formato + ventana mismo-mes + folio no usado.
2. `tax`: desglosar total → subtotal + IVA reconciliado.
3. `cfdi-builder`: armar payload Multiemisor.
4. Crear `Invoice` en estatus `pendiente` (transacción; el único (emisorId, folioTicket) da idempotencia).
5. `facturama-client.createCfdi` → si OK, obtener `getXml`/`getPdf` base64.
6. Persistir UUID + archivos (bytea), estatus `timbrada`.
7. `email-sender`: enviar XML+PDF al correo del receptor.
8. Si el PAC rechaza: estatus `error`, guardar `errorPac` traducido, mostrar mensaje accionable, permitir reintento.

## Testing Decisions

**Qué hace un buen test aquí:** prueba **comportamiento externo**, no detalles de implementación. Para los módulos puros, eso significa entradas → salidas observables (montos, payload, verdadero/falso de una regla), no llamadas internas. Para el adaptador, contrato sobre HTTP mockeado (request bien formado, parseo de respuesta), sin pegarle a Facturama real.

**Módulos con tests (los cuatro elegidos):**
- **`tax`**: tabla amplia de montos (incluye casos que descuadran a centavos, totales con .01/.99, montos grandes y de 1 peso); afirmar `subtotal + iva === total` y desglose esperado a 2 decimales.
- **`cfdi-builder`**: dado config de emisor + receptor + monto + concepto, el payload tiene los campos fijos correctos, el concepto e impuestos correctos, y el mapeo de receptor correcto; casos persona física (RFC 13) y moral (RFC 12).
- **`billing-rules`**: ventana mismo-mes (dentro/fuera, cruces de fin de mes, configurable); validaciones de formato (RFC 12/13 válidos e inválidos, CP de 5 dígitos, clave fuera de catálogo).
- **`facturama-client`**: tests de contrato con HTTP mockeado — header de auth Basic correcto, body de `createCfdi` conforme, parseo de PDF/XML base64, manejo de error del PAC.

**Prior art:** no hay (proyecto nuevo). Se establece el patrón: **Vitest** para unidad, módulos puros sin mocks, adaptador con `fetch` mockeado. Estos tests fijan el patrón para el resto del ERP.

## Out of Scope (Fase 1)
- Panel de administración (gestión de emisores/CSD/catálogos por UI) — alta vía CLI en F1.
- Consulta/validación de tickets contra ventas reales (feed de ventas / POS) — el monto no se valida contra la venta en F1.
- Autollenado de datos fiscales por RFC y OCR de Constancia de Situación Fiscal.
- Cancelación de CFDI desde el portal.
- Desglose línea por línea o catálogo de conceptos elegible por el cliente.
- Subdominios y dominios propios por emisor (solo ruteo por slug en F1).
- CFDI distintos a Ingreso (nómina, pagos/PPD, carta porte, notas de crédito).
- Multi-idioma (solo español).
- Cuentas Facturama por cliente (solo una cuenta Multiemisor centralizada).
- Pagos en parcialidades (PPD) — solo PUE.

## Further Notes
- **Distinción clave:** se factura **vía PAC (Facturama)**, no contra el SAT directo. Se usa el **CSD** del emisor (no la FIEL).
- **CFDI 4.0 es estricto:** Nombre + CP + Régimen del receptor deben coincidir con la Constancia de Situación Fiscal o el PAC rechaza; la UX debe traducir esos errores.
- **Sandbox primero:** desarrollar y probar todo contra el ambiente sandbox de Facturama (`apisandbox.facturama.mx`) antes de producción (`api.facturama.mx`); las cuentas son independientes por ambiente.
- **Seguridad:** el CSD (.cer/.key) se sube a Facturama; nosotros **no** almacenamos llaves privadas. Solo guardamos credenciales de API en secretos.
- **Anti-abuso F1 es parcial** por diseño: folio único + ventana mismo-mes. El candado fuerte (validación de monto contra venta, o token firmado en el ticket) entra en Fase 2.
- **Ralph:** el repo se prepara con `PRD.md` (este documento) + `progress.txt` con las tareas en orden para correr `ralph.ps1`.

## Verificación (end-to-end)
1. `docker compose up` levanta Postgres; `prisma migrate` + seed de catálogos curados.
2. Correr el CLI de alta de emisor con un CSD de **prueba** de Facturama → emisor creado y CSD cargado en sandbox.
3. `npm run dev`, entrar a `/f/[slug]` del emisor sembrado.
4. Capturar folio/fecha/monto + datos fiscales de prueba válidos → ver desglose → confirmar → CFDI **timbrado** en sandbox; pantalla de éxito con descarga XML+PDF; correo recibido vía Resend.
5. Reintentar el mismo folio → bloqueado por folio único.
6. Capturar fecha fuera del mes → bloqueado por ventana.
7. Capturar Nombre/CP que no coinciden con el SAT → mensaje de error del PAC traducido.
8. `npm test` → suites verdes de `tax`, `cfdi-builder`, `billing-rules`, `facturama-client`.
9. Verificar en BD: `Invoice` con UUID y estatus `timbrada`, `InvoiceFile` con XML y PDF en bytea.
