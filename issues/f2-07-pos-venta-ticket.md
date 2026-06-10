# F2·7 · POS: vender, ticket y descuento de inventario

**Tipo:** AFK
**Triage:** `ready-for-agent`

## Parent
PRD: [`../PRD-fase2.md`](../PRD-fase2.md) — ERP YOU · Fase 2

## What to build
El Módulo 3 (Punto de Venta): pantalla táctil que registra ventas por artículo, genera un ticket y
descuenta el inventario al CPM de la tienda. Se agregan `TicketPOS` (encabezado con folio único) y
`Venta` (líneas), y el módulo puro `pos-line`. El cierre de venta es **atómico** (stock + CPM +
movimiento + venta) y a prueba de concurrencia entre cajas.

Comportamiento end-to-end: el cajero elige **tienda** y **canal** (los precios se ajustan al canal),
agrega artículos a un carrito viendo el **total en vivo** en una UI táctil (tarjetas grandes por
categoría, total grande), y cierra la venta. Se genera un **ticket con folio** (`V-#####`) con
subtotal sin IVA, IVA, comisión y total, imprimible por navegador (`window.print()`). Cada línea
descuenta stock al **CPM de la tienda** y guarda costo, comisión y utilidad; se registra el
`Movimiento` de tipo VENTA. Se pueden registrar **devoluciones** (movimiento inverso). Si el cajero
tiene una tienda asignada, queda fija al iniciar sesión.

Matemática de línea (módulo `pos-line`, reusa `tax.desglosarIva` de Fase 1):
`pvSin = pv/1.16; iva = pv − pvSin; com = pvSin·comisionPct/100; costo = qty·CPM;
utilidad = pvSin − costo − com`.

## Acceptance criteria
- [ ] Modelos `TicketPOS` (folio único, tiendaId, fecha, usuarioId, canalId, medioPagoId, total, `folioTicket`?) y `Venta` (líneas con qty, precioUnit, totales, comisión, cpm, costo, utilidad, tipo `VENTA|DEVOLUCION`).
- [ ] Módulo puro `pos-line`: `calcularLineaVenta(...)` y `agregarTicket(lineas)`.
- [ ] UI táctil de POS: selección de tienda/canal, tarjetas de producto por categoría, carrito con total en vivo, cierre de venta.
- [ ] Cierre de venta **atómico** en `$transaction` (descuento de stock al CPM + `Movimiento` VENTA + `TicketPOS`+`Venta`), seguro ante concurrencia entre cajas.
- [ ] Precio resuelto por canal (recetas y productos); comisión por (canal, medio de pago).
- [ ] Ticket imprimible (`window.print()`) con folio, desglose y total; tienda fija si el cajero la tiene asignada.
- [ ] Devoluciones: movimiento inverso que reintegra stock y revierte la venta.
- [ ] **Tests** de `pos-line`: devolución (qty negativa), comisión 0, cuadre subtotal+IVA, costo al CPM.
- [ ] **Verificable:** vendo en pantalla táctil por canal → ticket con folio; el stock baja al CPM y la venta queda con costo/utilidad; una devolución revierte.

## Blocked by
- F2·5 · [Repreciado por impacto + productos + canales](f2-05-repreciado-productos-canales.md)
- F2·6 · [Compras y recosteo (CPM por tienda)](f2-06-compras-recosteo-cpm.md)
