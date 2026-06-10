# 9 · Pulido: preview de desglose + pantalla de éxito

**Tipo:** AFK

## Parent
PRD: [`../PRD.md`](../PRD.md) — ERP YOU · Fase 1: Portal de Autofacturación CFDI 4.0

## What to build
El pulido de la experiencia de captura y cierre. Antes de confirmar, el cliente ve un **preview
del desglose** (subtotal, IVA, total) calculado con `tax` para verificar que coincide con su
ticket. La pantalla de éxito final queda pulida (resumen de la factura, UUID, descargas, aviso de
correo enviado). Se agrega una consulta básica de facturas emitidas en BD para soporte/auditoría.

## Acceptance criteria
- [x] Preview de subtotal/IVA/total mostrado antes de confirmar, derivado de `tax` a partir del total capturado. *(preview en vivo en el formulario al teclear el total.)*
- [x] Pantalla de éxito pulida: resumen del receptor, UUID, botones de descarga XML/PDF y aviso de correo enviado. *(el envío real de correo es #5; por ahora es un aviso "próximamente".)*
- [x] Consulta básica (read-only) de `Invoice` por emisor para soporte/auditoría. *(`npm run facturas:list -- --slug demo`.)*
- [x] Estados de carga y error consistentes en el flujo de captura → confirmación → éxito. *(`useActionState`: pending + errores por campo + mensaje general.)*

## Estado
**COMPLETADO (2026-06-10, AFK).** Falta sólo el envío real de correo (slice #5, HITL: Resend).

## Blocked by
- #6 · [Catálogos + formulario fiscal completo](06-catalogos-formulario-fiscal.md)
- #7 · [Candado anti-abuso: folio único + ventana](07-candado-anti-abuso.md)
