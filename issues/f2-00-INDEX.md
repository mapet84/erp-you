# Índice de Issues — ERP YOU · Fase 2 (ERP de Restaurante)

Rebanadas verticales (tracer bullets). Cada una termina en un **resultado que puedes probar**.
PRD padre: [`../PRD-fase2.md`](../PRD-fase2.md) · Etiqueta de triage: `ready-for-agent`.
Orden de dependencias: **1 → 2 → 3 → 4 → 5**, con **6** tras #3, **7** tras #5+#6, y el resto como se indica.

| # | Issue | Tipo | Bloqueado por | User stories |
|---|-------|------|---------------|--------------|
| 1 | [Login al ERP (esqueleto vertical)](f2-01-login-esqueleto.md) ✅ | HITL | — | 1, 4, 59p |
| 2 | [Usuarios, tiendas y permisos](f2-02-usuarios-tiendas-rbac.md) ✅ | AFK | #1 | 2, 3, 5, 6, 7, 8, 9, 10 |
| 3 | [De ingrediente a precio sugerido](f2-03-ingrediente-a-precio.md) ✅ | AFK | #2 | 11, 12, 17, 19, 20, 60 |
| 4 | [Recetas completas](f2-04-recetas-completas.md) ✅ | AFK | #3 | 13, 14, 16 |
| 5 | [Repreciado por impacto + productos + canales](f2-05-repreciado-productos-canales.md) ✅ | AFK | #4 | 15, 21, 22, 23, 24 |
| 6 | [Compras y recosteo (CPM por tienda)](f2-06-compras-recosteo-cpm.md) ✅ | AFK | #3 | 18, 40, 41, 42, 43 |
| 7 | [POS: vender, ticket y descuento de inventario](f2-07-pos-venta-ticket.md) | AFK | #5, #6 | 30–39 |
| 8 | [Órdenes de venta con estados](f2-08-ordenes-venta.md) | AFK | #5 | 25, 26, 27, 28, 29 |
| 9 | [Gastos y estado de resultados](f2-09-gastos-estado-resultados.md) | AFK | #7 | 44, 45, 46, 47, 48, 49 |
| 10 | [Estado de factura (integración portal CFDI)](f2-10-estado-factura-portal.md) | AFK | #7 | 50 |
| 11 | [Pronóstico de ventas + explosión de compras](f2-11-pronostico-ventas-bom.md) | AFK | #7, #4 | 51, 52, 53, 54, 56, 58 |
| 12 | [Pronóstico de gastos + Cron semanal](f2-12-pronostico-gastos-cron.md) | HITL | #11, #9 | 55, 57 |

**Cobertura de tests (módulos puros, dentro de su rebanada):**
`rbac` → #2 · `costeo` + `pricing` → #3 (ampliados en #4/#5) · `inventario` → #6 · `pos-line` → #7 ·
`estado-resultados` → #9 · `forecast` → #11 · `money` → transversal (desde #1).

**HITL (requieren intervención humana):**
- #1 — `AUTH_SECRET` + correr el CLI de alta del primer admin.
- #12 — `CRON_SECRET` + configurar Vercel Cron / deploy.

El resto son **AFK** (implementables y mergeables sin intervención).

**No tocar:** el `00-INDEX.md` y los issues `01`–`09` de la Fase 1 (portal CFDI, ya completos).
