# F2·8 · Órdenes de venta con estados

**Tipo:** AFK
**Triage:** `ready-for-agent`

## Parent
PRD: [`../PRD-fase2.md`](../PRD-fase2.md) — ERP YOU · Fase 2

## What to build
El submódulo de **órdenes de venta** (pedidos por entregar) del Módulo 1, con clientes y el triple
seguimiento de estado: entrega, factura y cobro. Se agregan `Cliente`, `OrdenVenta` y
`OrdenVentaLinea`.

Comportamiento end-to-end: como CONFIGURADOR das de alta clientes (nombre, RFC, correos, teléfono,
días de pago, direcciones). Como OPERATIVO registras una **orden de venta** con cliente, tienda y
líneas (artículo, cantidad, precio), y la mueves por sus tres estados independientes:
**EstadoEntrega** (pendiente/entregado/cancelado), **EstadoFactura** y **EstadoCobro**. El sistema
calcula **fechas estimadas** de facturación y pago a partir de los días de pago del cliente, para
ver qué falta entregar o cobrar.

## Acceptance criteria
- [ ] Modelo `Cliente` (nombre, rfc?, correos, telefono?, diasPago?, direcciones, banco/clabe?) + CRUD.
- [ ] Modelos `OrdenVenta` (folio único, fecha, clienteId, tiendaId, totalPedido, estados entrega/factura/cobro, fechas) y `OrdenVentaLinea` (codigo, articulo, qty, precioUnit, subtotal).
- [ ] Enums `EstadoEntrega{PENDIENTE,ENTREGADO,CANCELADO}`, `EstadoFactura`, `EstadoCobro`.
- [ ] UI de captura de orden y de cambio de cada estado, con lista filtrable por estado.
- [ ] Cálculo de fechas estimadas de facturación y pago desde `diasPago` del cliente.
- [ ] **Verificable:** registro un pedido pendiente con líneas, lo marco entregado y luego facturado/cobrado, y veo qué falta por entregar o cobrar.

## Blocked by
- F2·5 · [Repreciado por impacto + productos + canales](f2-05-repreciado-productos-canales.md)
