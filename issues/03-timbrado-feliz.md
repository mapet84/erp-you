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
- [ ] Módulo `tax`: total con IVA → { subtotal, iva } a 2 decimales con `subtotal + iva === total`.
- [ ] Módulo `cfdi-builder`: arma el payload Multiemisor con todos los defaults fijos y el concepto/impuestos correctos a partir de emisor + receptor + monto.
- [ ] `facturama-client.createCfdi` integrado contra sandbox; idempotencia básica (no timbrar dos veces por doble submit).
- [ ] Modelo `Invoice` (emisorId, montos, datos del receptor, formaPago, estatus, uuid, facturamaCfdiId, createdAt) persistido en estatus `timbrada` al éxito.
- [ ] Formulario mínimo en `/f/[slug]` que dispara el flujo y muestra pantalla de éxito con UUID.
- [ ] **Tests** de `tax` (tabla amplia de montos, casos de descuadre de centavos) y `cfdi-builder` (defaults, mapeo, persona física RFC 13 y moral RFC 12) verdes.
- [ ] Verificación manual (HITL): un submit con datos de prueba válidos genera un CFDI timbrado en sandbox con UUID real.

## Blocked by
- #2 · [Alta de emisor por CLI + facturama-client](02-alta-emisor-cli.md)
