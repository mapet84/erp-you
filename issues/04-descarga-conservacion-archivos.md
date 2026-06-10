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
- [x] `facturama-client` con `getXml` y `getPdf` (base64) implementados. *(GET cfdi/{xml,pdf}/issuedLite/{id}, endpoints verificados contra el sandbox real.)*
- [x] Modelo `InvoiceFile` (invoiceId, tipo xml/pdf, contenido bytea, contentType) y persistencia tras timbrado.
- [x] Pantalla de éxito con botones de descarga de XML y PDF que entregan los archivos guardados con el `Content-Type` correcto. *(Ruta `GET /factura/[invoiceId]/[tipo]`.)*
- [x] Si la descarga desde Facturama falla, el `Invoice` queda timbrado pero se registra el faltante de archivo para reintento (no se pierde el UUID). *(`guardarArchivos` best-effort: el archivo faltante se puede reintentar; el UUID nunca se pierde.)*

## Estado
**COMPLETADO (2026-06-10, AFK).** Verificado: tras timbrar se conservan XML (`<?xml`, ~4.8KB) y
PDF (`%PDF-1.4`, ~54KB) como bytea; la ruta de descarga sirve 200 con Content-Type correcto y
`filename=UUID.{ext}`, 404 si no existe y 400 ante tipo inválido.

## Blocked by
- #3 · [Timbrado feliz end-to-end](03-timbrado-feliz.md)
