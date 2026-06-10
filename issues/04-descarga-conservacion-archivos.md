# 4 · Descarga y conservación de XML/PDF

**Tipo:** AFK

## Parent
PRD: [`../PRD.md`](../PRD.md) — ERP YOU · Fase 1: Portal de Autofacturación CFDI 4.0

## What to build
La obtención y conservación de los archivos fiscales del CFDI timbrado. Tras un timbrado
exitoso, se recuperan el XML y el PDF en base64 desde Facturama (`getXml`/`getPdf`), se decodifican
y se guardan como **bytea** en la BD (`InvoiceFile`, ligados al `Invoice`). La pantalla de éxito
expone botones de descarga de XML y PDF que sirven los bytes almacenados.

Esto cubre la obligación legal de conservar el XML (y PDF) sin depender exclusivamente del PAC.

## Acceptance criteria
- [ ] `facturama-client` con `getXml` y `getPdf` (base64) implementados.
- [ ] Modelo `InvoiceFile` (invoiceId, tipo xml/pdf, contenido bytea, contentType) y persistencia tras timbrado.
- [ ] Pantalla de éxito con botones de descarga de XML y PDF que entregan los archivos guardados con el `Content-Type` correcto.
- [ ] Si la descarga desde Facturama falla, el `Invoice` queda timbrado pero se registra el faltante de archivo para reintento (no se pierde el UUID).

## Blocked by
- #3 · [Timbrado feliz end-to-end](03-timbrado-feliz.md)
