# 5 · Entrega por correo (Resend)

**Tipo:** HITL — requiere API key de Resend y verificación del dominio remitente.

## Parent
PRD: [`../PRD.md`](../PRD.md) — ERP YOU · Fase 1: Portal de Autofacturación CFDI 4.0

## What to build
El envío de la factura al cliente por correo. El adaptador `email-sender` (Resend) toma el
`Invoice` timbrado y sus archivos (XML + PDF) y envía un correo al destinatario capturado, con una
plantilla en español y ambos archivos adjuntos. El envío ocurre tras persistir los archivos.

El correo es complementario a la descarga en pantalla: si el envío falla, el timbrado y la descarga
siguen siendo válidos; el fallo de correo se registra sin romper el flujo.

## Acceptance criteria
- [x] `email-sender` con Resend: API key desde variable de entorno, remitente del dominio configurado. *(`email/resend-client.ts` + `email/config.ts`; sin key/remitente → correo deshabilitado, no rompe.)*
- [x] Plantilla de correo en español con XML y PDF adjuntos. *(`email/template.ts` + adjuntos base64 en `send-invoice.ts`.)*
- [x] El envío se dispara tras un timbrado + persistencia de archivos exitosos. *(en la Server Action, después de `guardarArchivos`.)*
- [x] Un fallo de correo no invalida el timbrado ni la descarga; queda registrado para reintento. *(best-effort; `Invoice.correoEnviado/correoError`.)*
- [ ] Verificación manual (HITL): con la key y el dominio configurados, llega el correo con ambos adjuntos. *(pendiente: requiere `RESEND_API_KEY`.)*

## Estado
**Código completo (2026-06-10).** Falta sólo la verificación HITL real (enviar un correo con una API
key de Resend). En pruebas basta `from="onboarding@resend.dev"` enviando al propio correo de la cuenta.

## Blocked by
- #4 · [Descarga y conservación de XML/PDF](04-descarga-conservacion-archivos.md)
