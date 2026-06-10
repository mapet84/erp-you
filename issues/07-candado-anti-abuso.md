# 7 · Candado anti-abuso: folio único + ventana mismo-mes

**Tipo:** AFK

## Parent
PRD: [`../PRD.md`](../PRD.md) — ERP YOU · Fase 1: Portal de Autofacturación CFDI 4.0

## What to build
El candado anti-abuso de la Fase 1, para no permitir facturas arbitrarias/duplicadas contra el
RFC del emisor. El formulario captura folio del ticket + fecha + monto. Se aplican dos reglas:

1. **Folio único por emisor:** restricción única `(emisorId, folioTicket)` + chequeo previo, de
   modo que un folio ya facturado se bloquea (idempotencia anti doble-timbrado).
2. **Ventana mismo-mes:** la regla pura en `billing-rules` rechaza fechas fuera del mes calendario
   vigente (ventana configurable por emisor).

El monto capturado se guarda para auditoría; su validación contra venta real es Fase 2.

## Acceptance criteria
- [ ] Captura de folio, fecha del ticket y monto en el formulario.
- [ ] Restricción única `(emisorId, folioTicket)` en `Invoice` + chequeo que bloquea folios ya usados con mensaje claro.
- [x] `billing-rules`: regla de ventana (default mismo mes calendario, configurable por emisor) que rechaza fechas fuera de ventana con mensaje claro. *(src/lib/billing-rules.ts: `dentroDeVentana`.)*
- [ ] Idempotencia: un doble submit del mismo folio no produce dos timbrados.
- [x] **Tests** de `billing-rules` para la ventana: dentro/fuera, cruces de fin de mes, configuración por emisor.

> Avance autónomo 2026-06-10: la regla pura de ventana (`dentroDeVentana`) y sus tests están hechos.
> Falta lo dependiente de #3/UI: captura de folio+fecha+monto, restricción única (emisorId, folioTicket)
> e idempotencia anti doble-timbrado (necesitan el modelo `Invoice` del slice #3).

## Blocked by
- #3 · [Timbrado feliz end-to-end](03-timbrado-feliz.md)
