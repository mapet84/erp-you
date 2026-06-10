# 3 · Timbrado feliz end-to-end

**Tipo:** HITL — primer timbrado real contra el sandbox de Facturama con datos fiscales de prueba.

## Parent
PRD: [`../PRD.md`](../PRD.md) — ERP YOU · Fase 1: Portal de Autofacturación CFDI 4.0

## What to build
El camino feliz completo de autofacturación, lo más delgado posible. Desde el portal del emisor,
un formulario mínimo (RFC, nombre, CP, régimen receptor, uso CFDI, forma de pago, total con IVA)
produce un CFDI 4.0 timbrado en sandbox.

Flujo: `tax` desglosa el total con IVA en subtotal + IVA reconciliando centavos →
`cfdi-builder` arma el payload Multiemisor con los defaults fijos (`TipoDeComprobante=I`,
`MetodoPago=PUE`, `Moneda=MXN`, `Exportacion=01`, `LugarExpedicion`=CP emisor, `ObjetoImp=02`,
traslado IVA 16%, concepto = default del emisor) → `facturama-client.createCfdi` timbra →
se persiste un `Invoice` en estatus `timbrada` con su UUID → pantalla de éxito muestra el UUID.

Este slice establece los dos módulos puros centrales (`tax`, `cfdi-builder`) con sus tests.

## Acceptance criteria
- [x] Módulo `tax`: total con IVA → { subtotal, iva } a 2 decimales con `subtotal + iva === total`.
- [x] Módulo `cfdi-builder`: arma el payload Multiemisor con todos los defaults fijos y el concepto/impuestos correctos a partir de emisor + receptor + monto.
- [x] `facturama-client.createCfdi` integrado contra sandbox; idempotencia básica (no timbrar dos veces por doble submit).
- [x] Modelo `Invoice` (emisorId, montos, datos del receptor, formaPago, estatus, uuid, facturamaCfdiId, createdAt) persistido en estatus `timbrada` al éxito.
- [x] Formulario mínimo en `/f/[slug]` que dispara el flujo y muestra pantalla de éxito con UUID.
- [x] **Tests** de `tax` (tabla amplia de montos, casos de descuadre de centavos) y `cfdi-builder` (defaults, mapeo, persona física RFC 13 y moral RFC 12) verdes.
- [x] Verificación manual (HITL): un submit con datos de prueba válidos genera un CFDI timbrado en sandbox con UUID real.

## Estado
**COMPLETADO (2026-06-10, HITL).** Camino feliz end-to-end verificado contra el sandbox real:
la Server Action `emitirFactura` valida → desglosa IVA → arma CFDI 4.0 → timbra (`createCfdi`)
→ persiste `Invoice` "timbrada" con UUID. Idempotente por `(emisorId, folioTicket)`. Formulario
`useActionState` + pantalla de éxito con el UUID. 71 tests verdes, lint y build limpios.

Hallazgos CFDI 4.0 (reglas del SAT, no bugs): el `Name` de emisor/receptor debe ser el nombre
exacto del padrón sin "SA DE CV", y `DomicilioFiscalReceptor` de un RFC real se valida contra el
padrón del SAT. El camino feliz determinista usa Público en General (XAXX010101000/616/S01). La
traducción amable de esos rechazos del PAC es el slice #8.

## Blocked by
- #2 · [Alta de emisor por CLI + facturama-client](02-alta-emisor-cli.md)
