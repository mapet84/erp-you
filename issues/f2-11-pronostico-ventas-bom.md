# F2·11 · Pronóstico de ventas + explosión de compras

**Tipo:** AFK
**Triage:** `ready-for-agent`

## Parent
PRD: [`../PRD-fase2.md`](../PRD-fase2.md) — ERP YOU · Fase 2

## What to build
El Módulo 4 (Pronósticos): pronóstico de ventas parametrizable y su **explosión BOM** a compras de
ingredientes. Se agrega el agregado `VentaSemanal` (materializado desde las `Venta` del POS) y los
modelos `Pronostico` / `PronosticoLinea` / `PronosticoCompra` (+ `PronStatus` para la confirmación).
Se crea el módulo puro `forecast` y `ventas-semanales.server`.

Comportamiento end-to-end: como OPERATIVO corres el pronóstico por tienda y artículo/receta con
parámetros (semanas de historia, ponderación lineal/exponencial/plana, estacionalidad on/off,
tendencia on/off, factor de crecimiento, horizonte). El sistema calcula las **ventas proyectadas**
como promedio ponderado ajustado por estacionalidad y tendencia (con topes) y crecimiento, y genera
la **lista de compras por tienda** explotando cada receta a sus ingredientes (incluyendo
semi-terminados), con redondeo a mínimo de compra y costeo. Puedes **confirmar** el pronóstico para
bloquear su uso aguas abajo. Sin historia suficiente, el método **degrada** a promedio simple/plano.

## Acceptance criteria
- [ ] Modelo `VentaSemanal` (`@@unique([anio,semana,tiendaId,canalId,codigo])`) y `ventas-semanales.server` que lo materializa desde `Venta`.
- [ ] Modelos `Pronostico` (parámetros + estado), `PronosticoLinea` (unidades/ventas/costo proyectados) y `PronosticoCompra` (ingrediente, cantidad, cantidad redondeada, costo estimado, por tienda); `PronStatus` para confirmación.
- [ ] Módulo puro `forecast`: `pesos(n,metodo)`, `promedioPonderado`, `factorEstacional` (topes), `factorTendencia` (topes), `pronosticarUnidad`, `explotarBOM(lineas, resolverReceta)` (reusa `costeo.explotarSemiTerminado`), `redondearMinCompra`.
- [ ] UI de parámetros + ejecución + resultados (ventas proyectadas y lista de compras por tienda) + acción **confirmar**.
- [ ] Degradación a promedio simple/plano cuando no hay historia de año(s) previo(s).
- [ ] **Tests** de `forecast`: serie corta degradada, topes de estacionalidad/tendencia, pesos que suman 1, crecimiento 1.0 neutral, explosión BOM con redondeo a mínimo de compra.
- [ ] **Verificable:** con historial de ventas, corro un pronóstico y veo ventas proyectadas + lista de compras (BOM) por tienda; lo confirmo.

## Blocked by
- F2·7 · [POS: vender, ticket y descuento de inventario](f2-07-pos-venta-ticket.md)
- F2·4 · [Recetas completas](f2-04-recetas-completas.md)
