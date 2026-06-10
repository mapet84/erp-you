# Índice de Issues — ERP YOU · Fase 1 (Portal de Autofacturación CFDI 4.0)

Slices verticales (tracer bullets). Orden de dependencias: **1 → 2 → 3 → (4, 6, 7, 8) → 9**.
PRD padre: [`../PRD.md`](../PRD.md)

| # | Issue | Tipo | Bloqueado por | User stories |
|---|-------|------|---------------|--------------|
| 1 | [Esqueleto + resolución de tenant](01-esqueleto-tenant.md) | AFK | — | 1, 19p, 23p |
| 2 | [Alta de emisor por CLI + facturama-client (auth + CSD)](02-alta-emisor-cli.md) | HITL | #1 | 17, 18, 19, 20, 25 |
| 3 | [Timbrado feliz end-to-end](03-timbrado-feliz.md) | HITL | #2 | 2, 3, 4, 5, 26, 27, 30p |
| 4 | [Descarga y conservación de XML/PDF](04-descarga-conservacion-archivos.md) | AFK | #3 | 12, 21 |
| 5 | [Entrega por correo (Resend)](05-entrega-correo-resend.md) | HITL | #4 | 9, 13 |
| 6 | [Catálogos + formulario fiscal completo](06-catalogos-formulario-fiscal.md) | AFK | #3 | 6, 7, 8, 16, 28 |
| 7 | [Candado anti-abuso: folio único + ventana](07-candado-anti-abuso.md) | AFK | #3 | 14, 15, 22, 30 |
| 8 | [Manejo y traducción de errores del PAC](08-errores-pac.md) | AFK | #3 | 11, 29 |
| 9 | [Pulido: preview de desglose + pantalla de éxito](09-pulido-preview-exito.md) | AFK | #6, #7 | 10, 24 |

**Cobertura de tests:** `tax` y `cfdi-builder` → #3 · `facturama-client` → #2 · `billing-rules` → #6 y #7.

**HITL (requieren intervención humana):** #2 (credenciales sandbox + CSD de prueba), #3 (primer timbrado real en sandbox), #5 (API key Resend + verificación de dominio).
