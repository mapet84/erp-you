# PRD — ERP YOU · Fase 2 (ERP de Restaurante: Gestión, POS, Finanzas, Pronósticos)

> PRD de la Fase 2. Continúa sobre el repo de la Fase 1 (`erp-you`). Tracker de issues:
> archivos `issues/f2-NN-*.md` (índice en `issues/f2-00-INDEX.md`). Etiqueta de triage de las
> rebanadas: `ready-for-agent`.

## Context

La Fase 1 (`erp-you`) entregó un **portal público de autofacturación CFDI 4.0** (Next.js 16 App
Router · Prisma 6 · Postgres · Tailwind v4 · Zod · Vitest), con modelos `Emisor`, `Invoice`,
`InvoiceFile`, `CatalogoSat` en el esquema `public`, lógica pura en `src/lib/*` con tests Vitest,
e integración con Facturama (timbrado) y Resend (correo). **Completa y verificada (2026-06-10).**

Existe además un prototipo del ERP operativo en **5 apps HTML sobre Google Sheets** (`App RM 2005`:
`index.html` Gestión, `pos.html`, `finanzas.html`, `pronosticos.html`, `Codigo_gs.txt` backend
Apps Script). Toda la lógica corre client-side con flotantes de JS y cada app tiene su propio
login. La Fase 2 **porta ese prototipo a la app formal** para usarlo en varias tiendas y subirlo a
la nube, con base de datos real, cálculos server-side con `Decimal`, un único módulo de usuarios y
control de acceso por módulo y por tienda.

## Problem Statement

El negocio (un restaurante con varias tiendas) opera hoy su ERP en hojas de Google con apps HTML
sueltas: los cálculos financieros usan flotantes en el navegador, no hay base de datos formal, cada
módulo tiene su propio login con contraseñas en texto plano, y no se puede usar de forma confiable
en múltiples tiendas ni en la nube. El dueño necesita un ERP único, multitienda, con usuarios y
permisos centralizados, donde el costeo, los precios, el inventario, las finanzas y los pronósticos
sean correctos, auditables y operables por personal con distintos niveles de acceso.

## Solution

Construir, dentro del mismo proyecto Next.js, un **ERP de 4 módulos** que vive en su **propio
esquema Postgres (`erp`)** separado del portal CFDI (`public`), con:

- **Módulo de usuarios único** con autenticación real (Auth.js v5 + credenciales, bcrypt, sesiones
  en BD) y RBAC **por módulo** (rol `CONFIGURADOR`/`OPERATIVO`/`LECTOR`) **y por tienda**.
- **Módulo 1 · Gestión:** alta de ingredientes, recetas, semi-terminados, productos; costeo dual
  (costo de compra general + CPM por tienda); precios de venta por canal con margen objetivo por
  categoría/canal; comisiones; clientes; y órdenes de venta con estados de entrega/factura/cobro.
- **Módulo 3 · POS:** pantalla táctil por tienda y canal, ticket con folio, que descuenta inventario
  al CPM de la tienda y registra ventas con su costo y utilidad reales.
- **Módulo 2 · Finanzas:** compras con recosteo (MAP por tienda), captura de gastos por categoría y
  estado de resultados mensual/por rango/por tienda; muestra Estado de Factura leyendo `Invoice`.
- **Módulo 4 · Pronósticos:** pronóstico de ventas (promedio ponderado + estacionalidad + tendencia
  + crecimiento), explosión BOM a compras de ingredientes y proyección de gastos.

Toda la matemática vive en **módulos puros server-side con `Decimal`**, probados con Vitest
(patrón de Fase 1). Se despliega en **Vercel + Postgres Neon**; el pronóstico semanal corre como
**Vercel Cron**. La facturación **reutiliza el portal de Fase 1**: el POS genera el folio del ticket,
el cliente se autofactura en `/f/[slug]`, y el ERP refleja el estado leyendo `Invoice`.

## User Stories

**Usuarios, autenticación y acceso (módulo único)**
1. Como administrador, quiero crear usuarios con correo y contraseña, para dar de alta al personal sin auto-registro público.
2. Como administrador, quiero asignar a cada usuario un rol (`CONFIGURADOR`/`OPERATIVO`/`LECTOR`) **por cada módulo**, para que su acceso sea independiente entre Gestión, POS, Finanzas y Pronósticos.
3. Como administrador, quiero restringir a un usuario a una o varias tiendas, para que un cajero solo opere su tienda.
4. Como usuario, quiero iniciar sesión con correo y contraseña y mantener mi sesión, para usar el ERP de forma segura.
5. Como `LECTOR`, quiero ver pantallas y reportes pero no poder escribir, para consultar sin riesgo de modificar datos.
6. Como `OPERATIVO`, quiero crear y editar transacciones (ventas, órdenes, compras, gastos, correr pronóstico) pero no datos maestros, precios ni configuración.
7. Como `CONFIGURADOR`, quiero CRUD completo del módulo incluyendo datos maestros, precios, configuración y asignación de roles del módulo.
8. Como administrador, quiero desactivar un usuario sin borrarlo, para revocar acceso conservando su historial.
9. Como usuario con varias tiendas, quiero un selector de tienda en la barra, para cambiar el contexto operativo.
10. Como sistema, quiero negar el acceso a cualquier módulo donde el usuario no tenga rol, devolviendo 403, para que la autorización no dependa de ocultar la UI.

**Módulo 1 · Gestión — Datos maestros**
11. Como configurador, quiero dar de alta ingredientes (código, nombre, unidad, costo de compra, mínimo de compra), para construir el catálogo base.
12. Como configurador, quiero registrar el **costo de compra general** de cada ingrediente, para costear recetas y calcular precios.
13. Como configurador, quiero dar de alta recetas con su categoría, tamaño, SKU y componentes (ingredientes o semi-terminados, con cantidad, unidad, rendimiento), para definir productos vendibles.
14. Como configurador, quiero dar de alta semi-terminados componibles dentro de recetas (incluso anidados), para reutilizar preparaciones.
15. Como configurador, quiero dar de alta productos no-receta (código, descripción, categoría, unidad, costo), para vender artículos independientes.
16. Como sistema, quiero rechazar componentes cíclicos en semi-terminados, para evitar costeos infinitos.

**Módulo 1 · Gestión — Costeo dual y precios**
17. Como configurador, quiero ver el **costo de compra (general)** de cada receta calculado como Σ(costo de compra del ingrediente × cantidad ÷ rendimiento%), para conocer el costo estándar.
18. Como sistema, quiero calcular también el **costo CPM por tienda** de cada receta a partir del CPM por tienda de sus ingredientes, para conocer el costo real por tienda.
19. Como configurador, quiero definir un **margen objetivo por (categoría, canal)**, para que el precio sugerido se derive del costo de compra.
20. Como configurador, quiero precios de venta por canal (y por tamaño en recetas) que incluyan IVA, para vender al precio correcto en cada canal.
21. Como configurador, quiero que al cambiar el costo de compra de un ingrediente el sistema me muestre **una estimación del cambio de costo en las recetas afectadas**, para entender el impacto antes de confirmar.
22. Como configurador, quiero un botón para **actualizar el precio de venta** de las recetas afectadas según su margen objetivo por categoría/canal, para repreciar de una sola acción.
23. Como configurador, quiero registrar comisiones por (canal, medio de pago), para que el POS y las finanzas las descuenten.
24. Como lector, quiero un reporte de costos y márgenes por receta/producto y canal, para analizar rentabilidad.

**Módulo 1 · Gestión — Clientes y órdenes de venta**
25. Como configurador, quiero dar de alta clientes (nombre, RFC, correos, teléfono, días de pago, direcciones), para asociarlos a órdenes.
26. Como operativo, quiero registrar una orden de venta (pedido) con cliente, tienda y líneas (artículo, cantidad, precio), para controlar pedidos por entregar.
27. Como operativo, quiero marcar el **estado de entrega** de una orden (pendiente/entregado/cancelado), para dar seguimiento al despacho.
28. Como operativo, quiero ver el **estado de factura** y **estado de cobro** de cada orden, para saber qué falta facturar o cobrar.
29. Como sistema, quiero calcular fechas estimadas de facturación y pago a partir de los días de pago del cliente, para anticipar el flujo.

**Módulo 3 · POS e inventario**
30. Como cajero, quiero seleccionar tienda y canal (tienda, Uber, etc.), para que los precios se ajusten al canal elegido.
31. Como cajero, quiero una pantalla táctil con tarjetas de productos por categoría y un total grande, para vender rápido.
32. Como cajero, quiero agregar artículos al carrito y ver el total en vivo, para cobrar con certeza.
33. Como cajero, quiero cerrar la venta y generar un ticket con folio (`V-#####`), subtotal sin IVA, IVA, comisión y total, para entregar al cliente.
34. Como sistema, quiero que cada venta descuente el inventario de la tienda al **CPM de la tienda** y registre un movimiento, para mantener stock y costo reales.
35. Como sistema, quiero registrar por línea de venta el costo (CPM × cantidad), la comisión y la utilidad, para alimentar finanzas y pronósticos.
36. Como cajero, quiero registrar devoluciones, para corregir ventas (movimiento inverso).
37. Como cajero con tienda asignada, quiero que mi tienda quede fija al iniciar sesión, para no equivocarme de tienda.
38. Como cajero, quiero imprimir el ticket desde el navegador (`window.print()`), para entregarlo físicamente (impresora térmica diferida a una rebanada posterior).
39. Como sistema, quiero que el cierre de venta sea atómico (stock + CPM + movimiento + venta) y a prueba de concurrencia entre cajas, para no corromper el inventario.

**Módulo 2 · Finanzas — Compras y recosteo**
40. Como operativo, quiero registrar compras de ingredientes (fecha, código, cantidad, costo unitario, tienda, medio de compra), para reabastecer.
41. Como sistema, quiero que cada compra recalcule el **CPM por MAP**: `nuevoCPM = (stockActual × cpmActual + qtyEntra × costoCompra) ÷ (stockActual + qtyEntra)`, e incremente el stock, para mantener el costo móvil correcto.
42. Como sistema, quiero que al actualizar el CPM se actualicen los costos CPM de las recetas afectadas, para reflejar el costo real.
43. Como operativo, quiero registrar cuentas por pagar y su estado, para controlar pagos a proveedores.

**Módulo 2 · Finanzas — Gastos y estado de resultados**
44. Como operativo, quiero capturar gastos por categoría (renta, nómina y otros) con monto, IVA e ISR, para registrar la operación.
45. Como sistema, quiero auto-calcular IVA e ISR del gasto según la categoría seleccionada, para reducir errores.
46. Como operativo, quiero repartir un gasto central entre tiendas (por ventas, por utilidad o manual), para asignar costos correctamente.
47. Como lector, quiero ver el **estado de resultados** (ingresos netos, costo de ventas, comisiones, utilidad bruta, gastos operativos por tipo, EBIT, otros ingresos/gastos, UAI, impuestos, utilidad neta), para evaluar el negocio.
48. Como lector, quiero filtrar el estado de resultados por mes, rango de fechas y tienda, para analizar por periodo y sucursal.
49. Como sistema, quiero que el costo de ventas use el **CPM por tienda** registrado en cada venta, para reflejar el costo real.
50. Como operativo, quiero ver el **Estado de Factura** de cada venta/orden leyendo la tabla `Invoice` de Fase 1 (ligado por `folioTicket`), para saber qué ya se autofacturó en el portal.

**Módulo 4 · Pronósticos**
51. Como operativo, quiero correr el pronóstico de ventas por tienda y artículo/receta, para estimar el próximo periodo.
52. Como configurador, quiero parametrizar el pronóstico (semanas de historia, ponderación lineal/exponencial/plana, estacionalidad on/off, tendencia on/off, factor de crecimiento, horizonte), para ajustar el método.
53. Como sistema, quiero calcular el pronóstico como promedio ponderado de las últimas N semanas, ajustado por estacionalidad y tendencia (con topes) y por crecimiento, para una estimación robusta.
54. Como operativo, quiero generar la **explosión BOM** del pronóstico a compras de ingredientes por tienda (incluyendo semi-terminados), con redondeo a mínimo de compra y costeo, para planear compras.
55. Como operativo, quiero proyectar gastos recurrentes por periodicidad, para anticipar el flujo.
56. Como operativo, quiero **confirmar** un pronóstico, para bloquear su uso aguas abajo y evitar datos obsoletos.
57. Como sistema, quiero ejecutar el pronóstico semanal automáticamente vía Vercel Cron, para mantenerlo al día sin intervención.
58. Como sistema, en el arranque sin historia quiero degradar el método a promedio simple/plano, para que el pronóstico funcione desde el inicio.

**Despliegue y datos**
59. Como dueño, quiero la app en la nube (Vercel + Neon) con HTTPS, para usarla en varias tiendas.
60. Como dueño, quiero empezar con datos en blanco y capturar los maestros por la nueva UI, para validar las pantallas de captura.

**Navegación y búsqueda (UX) — añadido tras la 1ª prueba**
61. Como usuario, quiero que los selectores de artículos sean **buscables**: al escribir la descripción (o el código) en el campo, el sistema filtra y me muestra el código correspondiente, para encontrar el artículo más rápido (en recetas, semi-terminados, compras y órdenes; y un buscador equivalente en la rejilla del POS).
62. Como usuario, quiero un botón **Inicio** en todas las pantallas que me regrese al punto de partida (dashboard).
63. Como usuario, quiero un botón **Atrás** en todas las pantallas que me lleve a la pantalla anterior **sin guardar**.
64. Como usuario, quiero una **barra lateral** con las secciones del módulo en el que estoy, para moverme entre ellas con un clic.
65. Como configurador, quiero que el **código de ingrediente se asigne automático y consecutivo** en el rango 100001–199999, para no tener que inventarlo.

**Carga masiva (CSV) y códigos automáticos — añadido tras la 1ª prueba**
66. Como configurador, quiero **importar por CSV** ingredientes, productos, semi-terminados y recetas, para cargar muchos de una sola vez (recetas y semi-terminados en formato largo: una fila por componente, agrupadas por nombre). La importación es idempotente por nombre.
67. Como sistema, quiero asignar los **códigos/SKU automáticamente**: receta (producto terminado) = abrevCategoría + abrevTamaño + consecutivo; producto = abrevCategoría + consecutivo; semi-terminado = `ST` + consecutivo; ingrediente = consecutivo 100001–199999. Para ello cada categoría/tamaño tiene una **abreviatura** (configurable; si falta, se deriva del nombre).
68. Como configurador, quiero una sección de **Configuración** con catálogos: **categorías** (con abreviatura), **tamaños** (con abreviatura), **unidades de medida y sus conversiones** (1 origen = factor × destino), **canales** (con medio de pago principal y comisión por medio), **medios de pago**, **medios de compra** (con días de crédito), **motivos de ajuste de inventario** y **tiendas**, para administrar todos los parámetros desde un solo lugar.
69. Como **administrador**, quiero **eliminar** registros (artículos: ingredientes/recetas/productos/semi-terminados; y todos los catálogos de configuración), incluyendo **borrado masivo** de ingredientes y recetas, para limpiar datos. Si un registro está en uso, no se elimina (no rompe).
70. Como configurador, quiero **editar** ingredientes (nombre, unidad, costo, mínimo) y recetas (nombre, categoría, tamaño y componentes), para corregirlas sin recrearlas; el código/SKU no cambia.

## Implementation Decisions

**Arquitectura y datos**
- **Mismo repo, esquema Postgres separado.** El ERP vive en el esquema `erp` (Prisma `multiSchema`); los 4 modelos de Fase 1 quedan en `public` con `@@schema("public")`. La migración inicial solo debe `CREATE SCHEMA erp` y atribuir esquemas, sin recrear las tablas `public.*` (revisar el SQL generado antes de aplicar).
- **Vínculo con facturación sin FK cross-schema.** El ERP solo **lee** `public.Invoice`, ligando por `folioTicket` (string) para derivar el Estado de Factura. No hay relación Prisma entre esquemas.
- **Una empresa, varias tiendas.** Catálogo/maestros compartidos; transaccional (ventas, inventario, gastos) scoped por `tiendaId`. **Un solo RFC/Emisor** para toda la empresa; `tienda` es dimensión operativa/reporte.
- **Money con `Decimal`.** Montos `Decimal(14,2)`; costos unitarios/CPM `Decimal(14,6)`; cantidades/stock `Decimal(14,4)`; porcentajes `Decimal(7,4)` guardados como número humano (16 = 16%) y divididos entre 100 en el módulo. `Decimal` no es serializable a Client Components: las páginas convierten a `string` antes de pasar a la UI (`money` module).

**Modelo de costo dual (decisión clave)**
- **Ingrediente:** `costoCompra` general/company-wide (editable, referencia de compra) **y** `cpm` **por tienda** (móvil). El cambio manual de `costoCompra` **no** mueve el CPM; el CPM solo se mueve al registrar una **entrada/compra** en la tienda, vía MAP: `nuevoCPM = (stockActual·cpmActual + qtyEntra·costoCompra)/(stockActual+qtyEntra)`.
- **Receta/Semi-terminado:** se calculan **dos costos**: (a) **costo de compra general** = Σ(componente.costoCompra × cantidad ÷ rendimiento%), y (b) **costo CPM por tienda** = Σ(componente.cpm[tienda] × …).
- **Precio de venta** se calcula con el **costo de compra general** y el **margen objetivo por (categoría, canal)**: `precioSinIVA = costoCompra/(1−margen)`, `precio = precioSinIVA × 1.16`.
- **COGS y utilidad** (POS, estado de resultados) usan el **CPM por tienda** vigente al momento de la venta (snapshot en la línea de venta).
- Al cambiar `costoCompra` de un ingrediente: el sistema **estima el impacto en pesos** sobre el costo de compra de las recetas afectadas y ofrece **actualizar precios** según el margen objetivo. Los costos de receta se mantienen como snapshots y se recalculan en este flujo (acción de recosteo) y al recalcular CPM por compras.

**Identidad y RBAC**
- **Auth.js v5 (NextAuth)** con proveedor de credenciales, `bcrypt`, **sesiones en BD** vía `@auth/prisma-adapter`. Sin auto-registro; usuarios creados por admin (CLI `alta-usuario` para el primer admin, espejo de `alta-emisor`).
- Modelos `User`, `UserModuleRole(user, modulo, rol)` `@@unique([userId,modulo])`, `UserStore(user, tienda)`; más `Account`/`Session`/`VerificationToken` del adapter.
- **Matriz de roles** en módulo puro `rbac.can(user, modulo, accion, tienda?)`: `LECTOR`={read}, `OPERATIVO`={read,write}, `CONFIGURADOR`={read,write,configure}. Default de scope: `CONFIGURADOR` sin filas de tienda = todas; `OPERATIVO`/`LECTOR` requieren ≥1 tienda.
- **Tres capas de defensa** alrededor del mismo `can()`: (1) `middleware.ts` solo verifica sesión (edge, sin bcrypt/Prisma fino); (2) guard en cada `page.tsx` (`requireCan(modulo,"read",tienda?)`, corre en Node); (3) guard en cada server action antes de tocar la BD (`requireCan(modulo,"write"|"configure",tienda)`), devolviendo el `State{error}` estándar.

**Módulos puros (deep modules, `src/lib/erp/*`)** — todos con tests Vitest:
- `costeo` — costo de receta dual (compra + CPM), explosión recursiva de semi-terminados, detección de ciclos.
- `inventario` — MAP/CPM, entrada/salida/ajuste/merma → movimientos firmados; guarda de división por cero y política de stock negativo.
- `pricing` — `pvSinIva`, `margen`, `precioDesdeMargen(costoCompra, margenObjetivo)`; margen objetivo por (categoría, canal).
- `pos-line` — matemática de línea (IVA vía `tax.desglosarIva` de Fase 1, comisión, costo CPM, utilidad) y agregación de ticket.
- `estado-resultados` — ensamblado del P&L por `TipoER` desde filas planas.
- `forecast` — pesos (lineal/exp/plano), promedio ponderado, factor estacional (topes), factor tendencia (topes), crecimiento, y explosión BOM a compras.
- `rbac` — `can()` puro.
- `money` — helpers de `Decimal`/serialización RSC→cliente.
- Lógica con BD en `*.server.ts` (sin Vitest): `auth.server`, `session.server`, `inventario.server` (`$transaction` atómico), `costeo.server`, `ventas-semanales.server`, `facturacion-link.server`, `forecast.server`.

**UI / rutas (App Router)**
- Fase 1 intacta en `/f/[slug]` y `/factura/...`. El ERP vive en el grupo de rutas `(erp)` con layout propio (nav de módulos + selector de tienda + sesión): `login`, `dashboard`, `gestion/*`, `pos/*`, `finanzas/*`, `pronosticos/*`, `admin/{usuarios,tiendas}`; `api/auth/[...nextauth]`, `api/cron/forecast`.
- **POS:** UI táctil responsiva (tarjetas grandes, total grande) en navegador de tablet; ticket vía `window.print()`. Impresora térmica (ESC/POS) **diferida** a rebanada posterior.

**Despliegue**
- **Vercel + Neon.** `DATABASE_URL` (pooled, runtime) + `DIRECT_URL` (directo, migraciones). Online-only (sin offline en POS). Pronóstico semanal = **Vercel Cron** (`0 6 * * 1`) en `api/cron/forecast` validando `CRON_SECRET` por header `Bearer`.

**Navegación y búsqueda (UX)**
- **Selectores buscables:** componente cliente reutilizable `components/erp/ComboBox` — input de texto que filtra por nombre o código (substring, hasta 50 resultados), Enter elige el primero, publica el id en un input oculto con el mismo `name` que el `<select>` que reemplaza. Se aplica a recetas, semi-terminados, compras y órdenes (con `key={tipo}` para reiniciar al cambiar de tipo). El POS suma un campo de búsqueda que filtra la rejilla.
- **Inicio / Atrás globales:** `components/erp/NavButtons` (cliente) en el encabezado del layout `(erp)` — Atrás usa `router.back()` (no guarda), Inicio enlaza a `/dashboard`. Presente en toda pantalla del ERP.
- **Barra lateral por módulo:** `components/erp/ModuleSidebar` (cliente) deriva el módulo del primer segmento de la URL (`usePathname`) y lista sus secciones, marcando activa la de prefijo más largo. No aparece fuera de un módulo.
- **Código de ingrediente automático:** `siguienteCodigoIngrediente()` asigna el consecutivo en [100001, 199999]; el formulario ya no pide el código.
- **Códigos/SKU automáticos:** módulo puro `codigos.ts` (`abreviar`, `siguienteNumero`, `prefijoReceta`) + `codigos.server.ts` (`siguienteSkuReceta`/`siguienteCodigoProducto`/`siguienteSkuSemiTerminado`). Categoría y Tamaño ganan `abreviatura?` (derivada del nombre si falta). Los formularios de receta/producto/semi ya no piden el código.
- **Importación CSV:** parser puro `csv.ts` (`parseCsv`/`parseCsvObjects`, con comillas/saltos) + `import-csv.server.ts` (4 importadores que resuelven catálogos por nombre — creándolos si faltan —, asignan códigos y son idempotentes por nombre). UI en `/gestion/importar` (subida de archivo o pegado), con formato y resumen de creados/saltados/errores.
- **Sección Configuración (`/configuracion`):** grupo de rutas gateado por `requireCan("GESTION","configure")`, con la barra lateral propia. Componente cliente genérico `components/erp/CatalogForm` (campos declarativos + reset). Nuevos modelos `ConversionUnidad` (origen/destino/factor) y `MotivoAjuste`; `Canal` gana `medioPagoPrincipalId`. Sub-páginas: categorías, tamaños, unidades+conversiones, canales (+medio principal +comisiones), medios de pago, medios de compra, motivos de ajuste y tiendas.
- **Eliminar / editar (admin):** los borrados se gatean con `requireAdmin` y son **FK-safe** (try/catch: si está referenciado, no borra). `components/erp/DeleteButton` (confirm). Borrado masivo con `components/erp/BulkDeleteBar` (patrón `form=` id: los checkboxes `name="ids"` se asocian por el atributo `form` para no anidar formularios). Edición gateada con `configure`: páginas `/gestion/ingredientes/[id]` y `/gestion/recetas/[id]/editar` (reemplaza componentes en `$transaction`; el SKU se preserva). `ComboBox` admite `defaultValue` para preseleccionar al editar.

## Testing Decisions

- **Qué es un buen test:** probar **comportamiento externo**, no detalles de implementación. Los módulos puros reciben POJOs/`Decimal` y devuelven resultados deterministas; se prueban con tablas de casos (montos, bordes, descuadres de centavos), igual que `tax.test.ts`/`billing-rules.test.ts` de Fase 1.
- **Cobertura (TODOS los módulos puros), dentro de la rebanada que los introduce:**
  - `rbac` (#2) — matriz completa rol×acción, scope por tienda, módulo sin rol = deny.
  - `costeo` (#3, ampliado en #4/#5) — rendimiento 100/50, semi anidado, ciclo (throw), suma exacta de costo dual.
  - `pricing` (#3, ampliado en #5) — margen 0, costo>pv, frontera, `precioDesdeMargen` por categoría/canal.
  - `inventario` (#6) — stock 0 inicial, guarda división por cero, política de stock negativo, CPM estable ante compra al mismo precio, MAP correcto.
  - `pos-line` (#7) — devolución (qty negativa), comisión 0, cuadre subtotal+IVA, costo al CPM.
  - `estado-resultados` (#9) — mapeo por `TipoER`, signo de `OTRO_INGRESO`, rango vacío.
  - `forecast` (#11) — serie corta degradada, topes de estacionalidad/tendencia, pesos que suman 1, crecimiento 1.0 neutral, explosión BOM con redondeo a mínimo de compra.
  - `money` (transversal desde #1) — round-trip `Decimal`↔string, serialización RSC.
- **Prior art:** `src/lib/tax.test.ts`, `src/lib/billing-rules.test.ts`, `src/lib/cfdi-builder.test.ts`, `src/lib/facturama/client.test.ts` (fetch mockeado). Vitest `environment: node`, `include: src/**/*.test.ts`.

## Out of Scope

- **SaaS multiempresa.** Solo una empresa con varias tiendas (sin tenant `Empresa` por ahora).
- **Importación de datos** desde Google Sheets (se arranca en blanco).
- **Timbrado interno desde el ERP** y CFDI multilínea (se reutiliza el portal de autofacturación de Fase 1; el ERP solo lee `Invoice`).
- **POS offline** y **impresión térmica ESC/POS** (online-only; impresión por navegador; térmica diferida).
- **Cancelación de CFDI**, OCR/autollenado de constancia, subdominios por cliente (pendientes de Fase 1).
- **App móvil nativa** (es web responsiva).

## Further Notes

- **Riesgos/decisiones técnicas a vigilar:** (1) Prisma `multiSchema` + Neon pooler — usar `DIRECT_URL` para migraciones y confirmar que la migración no recrea `public.*`; (2) serialización de `Decimal` a Client Components — convertir a `string` en el servidor; (3) **concurrencia de inventario** entre cajas — descuento de stock/CPM en `$transaction` con aislamiento adecuado (serializable o bloqueo de fila sobre `Inventario`); (4) estacionalidad/tendencia sin historia el primer año — degradar a promedio simple; (5) reglas precisas de IVA acreditable/ISR en el estado de resultados — validar con contabilidad real antes de la rebanada #9 y documentar qué impuestos se calculan vs. informativos.
- **Granularidad de venta:** se introduce un encabezado `TicketPOS` (folio único, vínculo 1:1 con `Invoice` por `folioTicket`, transacción atómica) además de las líneas `Venta` — leve desviación del prototipo plano (1 fila por línea), justificada por unicidad de folio e integridad transaccional.
- **Convención de lenguaje:** el dominio y los artefactos (PRD, issues) van en **español**, como en Fase 1.
- **Rebanadas:** ver `issues/f2-00-INDEX.md` y `issues/f2-01..12-*.md`.
