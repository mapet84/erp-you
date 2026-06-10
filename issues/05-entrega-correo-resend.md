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
- [ ] `email-sender` con Resend: API key desde variable de entorno, remitente del dominio configurado.
- [ ] Plantilla de correo en español con XML y PDF adjuntos.
- [ ] El envío se dispara tras un timbrado + persistencia de archivos exitosos.
- [ ] Un fallo de correo no invalida el timbrado ni la descarga; queda registrado para reintento.
- [ ] Verificación manual (HITL): con la key y el dominio configurados, llega el correo con ambos adjuntos.

## Blocked by
- #4 · [Descarga y conservación de XML/PDF](04-descarga-conservacion-archivos.md)
