# F2·6 · Compras y recosteo (CPM por tienda)

**Tipo:** AFK
**Triage:** `ready-for-agent`

## Parent
PRD: [`../PRD-fase2.md`](../PRD-fase2.md) — ERP YOU · Fase 2

## What to build
El segundo costo del modelo dual: el **CPM (costo promedio móvil) por tienda**, alimentado por
**compras**. Se agregan `Inventario` (stock + CPM + valor, por tienda y código), `Movimiento`
(ledger firmado), `Compra` (cuentas por pagar) y el catálogo `MedioCompra`. Se crea el módulo puro
`inventario` (MAP) y la lógica `inventario.server` que aplica el movimiento de forma atómica.

Comportamiento end-to-end: como OPERATIVO registras una **compra** de un ingrediente (cantidad,
costo unitario, tienda, medio de compra). El sistema **recalcula el CPM por MAP**:
`nuevoCPM = (stockActual·cpmActual + qtyEntra·costoCompra)/(stockActual + qtyEntra)`, **incrementa el
stock** de esa tienda, registra un `Movimiento` de tipo COMPRA y deja una cuenta por pagar con su
estado. El **costo CPM por tienda** de las recetas que usan ese ingrediente se actualiza en
consecuencia. (El cambio manual del `costoCompra` del ingrediente **no** mueve el CPM; solo lo mueve
una entrada/compra.)

## Acceptance criteria
- [ ] Modelos `Inventario` (`@@unique([tiendaId,codigo])`, stock/cpm/valorTotal), `Movimiento` (firmado: qty, cpm, costoTotal, tipoMovimiento) y `Compra` (fecha, codigo, cantidad, costoUnitario, tiendaId, medioCompraId, monto, estado) + catálogo `MedioCompra`.
- [ ] Módulo puro `inventario`: `recostearCompra({stockPrev,cpmPrev,qtyIn,costoUnitCompra})` (MAP) y helpers de entrada/salida/ajuste/merma que devuelven el movimiento firmado.
- [ ] `inventario.server`: aplica compra en `$transaction` (actualiza `Inventario` + escribe `Movimiento` + crea `Compra`).
- [ ] El **costo CPM por tienda** de recetas/semi se calcula desde el CPM de sus ingredientes (extiende `costeo` a la base CPM).
- [ ] UI de compras y vista de inventario por tienda (stock, CPM, valor); cuentas por pagar con estado.
- [ ] **Tests** de `inventario`: stock 0 inicial, guarda de división por cero, CPM estable ante compra al mismo precio, MAP correcto, política de stock negativo.
- [ ] **Verificable:** registro una compra → CPM y stock de la tienda se actualizan por MAP y el costo CPM de las recetas afectadas cambia.

## Blocked by
- F2·3 · [De ingrediente a precio sugerido](f2-03-ingrediente-a-precio.md)
