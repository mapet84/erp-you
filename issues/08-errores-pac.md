# 8 · Manejo y traducción de errores del PAC

**Tipo:** AFK

## Parent
PRD: [`../PRD.md`](../PRD.md) — ERP YOU · Fase 1: Portal de Autofacturación CFDI 4.0

## What to build
El manejo de los rechazos de timbrado del PAC. CFDI 4.0 es estricto: si el Nombre, CP o Régimen
del receptor no coinciden con su Constancia de Situación Fiscal, Facturama rechaza. Este slice
captura esos errores, los **traduce a mensajes accionables en español**, marca el `Invoice` en
estatus `error` con el detalle del PAC, y permite al cliente corregir y reintentar sin perder lo
ya capturado.

## Acceptance criteria
- [x] Captura de errores de `facturama-client.createCfdi` y mapeo de los códigos/causas comunes (RFC/Nombre/CP/Régimen no coinciden, RFC no válido, etc.) a mensajes en español. *(`pac-errors.ts`; el detalle real se lee de `ModelState`.)*
- [x] `Invoice` queda en estatus `error` con el detalle del PAC (`errorPac`) cuando el timbrado falla.
- [x] La UI muestra el mensaje accionable y permite corregir los datos y reintentar conservando lo capturado. *(la Server Action devuelve `error` + `values`; el formulario repuebla.)*
- [x] Un error del PAC no consume el folio de forma definitiva: el reintento exitoso del mismo folio sí timbra. *(verificado contra sandbox: CP equivocado → "error", reintento → "timbrada" y `errorPac` se limpia.)*

## Estado
**COMPLETADO (2026-06-10, AFK).** Casos reales traducidos y verificados: nombre del receptor que no
coincide, `DomicilioFiscalReceptor` fuera del padrón, RFC inválido, problema de sello/CSD, y un genérico
accionable para lo desconocido.

## Blocked by
- #3 · [Timbrado feliz end-to-end](03-timbrado-feliz.md)
