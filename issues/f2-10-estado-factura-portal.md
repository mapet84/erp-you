# F2·10 · Estado de factura (integración con el portal CFDI)

**Tipo:** AFK
**Triage:** `ready-for-agent`

## Parent
PRD: [`../PRD-fase2.md`](../PRD-fase2.md) — ERP YOU · Fase 2

## What to build
La integración de facturación reutilizando el portal de autofacturación de Fase 1, **sin timbrado
nuevo**. El POS ya genera el folio del ticket (`folioTicket`); el cliente se autofactura en el
portal público `/f/[slug]`, y el ERP **lee** la tabla `public.Invoice` para reflejar el estado. Se
agrega `facturacion-link.server`, que resuelve el `Invoice` por `(emisorId, folioTicket)` sin FK
cross-schema (una sola empresa = un solo Emisor/RFC).

Comportamiento end-to-end: un ticket vendido en el POS aparece como **"SIN FACTURA"**; cuando el
cliente captura ese folio en `/f/[slug]` y obtiene su CFDI, el mismo ticket en el ERP pasa a
**"FACTURADA"** (mostrando UUID/folio fiscal). El estado se deriva de `Invoice`, no se almacena por
duplicado de forma autoritativa.

## Acceptance criteria
- [ ] `facturacion-link.server`: dado un `folioTicket`, busca `public.Invoice` por `(emisorId, folioTicket)` y devuelve estado (sin factura / facturada) + UUID si existe.
- [ ] El POS escribe `folioTicket` en `TicketPOS` de forma compatible con el candado anti-duplicado del portal (mismo folio que el cliente capturará).
- [ ] Vista de tickets/órdenes con columna **Estado de Factura** derivada de `Invoice` (no FK cross-schema; lectura por `folioTicket`).
- [ ] Caso sin Emisor/factura aún: muestra "SIN FACTURA" sin error.
- [ ] **Verificable:** vendo un ticket (SIN FACTURA), me autofacturo en `/f/[slug]` con ese folio, y el ticket en el ERP muestra "FACTURADA" con su UUID.

## Blocked by
- F2·7 · [POS: vender, ticket y descuento de inventario](f2-07-pos-venta-ticket.md)
