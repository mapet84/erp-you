# F2·5 · Repreciado por impacto + productos + canales

**Tipo:** AFK
**Triage:** `ready-for-agent`

## Parent
PRD: [`../PRD-fase2.md`](../PRD-fase2.md) — ERP YOU · Fase 2

## What to build
Completar la parte comercial del Módulo 1: el flujo de **impacto y repreciado** al cambiar costos,
los **productos no-receta**, los **precios por canal** completos y las **comisiones**. Se agregan
`Producto` y `ProductoPrecio`, `PrecioReceta` (por canal y tamaño), `Comision(canal, medioPago)` y
el catálogo `MedioPago`.

Comportamiento end-to-end: como CONFIGURADOR cambias el **costo de compra** de un ingrediente y el
sistema te muestra una **estimación en pesos del cambio de costo** en todas las recetas afectadas
(antes de confirmar); con un botón **actualizas el precio de venta** de esas recetas a su **margen
objetivo por (categoría, canal)**. Además das de alta productos no-receta con su costo y su precio
por canal, y registras comisiones por (canal, medio de pago). Un reporte muestra costo y margen por
receta/producto y canal.

## Acceptance criteria
- [ ] Modelos `Producto` (codigo, descripcion, categoriaId, unidadId, costo, minCompra) y `ProductoPrecio(productoId, canalId, precio)`.
- [ ] Modelo `PrecioReceta(recetaId, tamanoId?, canalId, precio)` `@@unique([recetaId,tamanoId,canalId])`.
- [ ] Catálogo `MedioPago` y modelo `Comision(canalId, medioPagoId, comisionPct)` `@@unique([canalId,medioPagoId])`.
- [ ] Flujo de cambio de `costoCompra`: vista de **impacto** (Δ pesos por receta afectada) antes de confirmar.
- [ ] Acción **repreciar** (CONFIGURADOR): actualiza precios de las recetas afectadas según margen objetivo por categoría/canal; re-snapshot de costos.
- [ ] Reporte de costos y márgenes por receta/producto y canal (lectura).
- [ ] **Tests** de `pricing` ampliados: `precioDesdeMargen` por (categoría, canal), repreciado idempotente.
- [ ] **Verificable:** cambio el costo de un ingrediente → veo el impacto en pesos → repreciar deja las recetas afectadas en su margen objetivo; vendo un producto no-receta con su precio por canal.

## Blocked by
- F2·4 · [Recetas completas](f2-04-recetas-completas.md)
