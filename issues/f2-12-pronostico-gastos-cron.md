# F2·12 · Pronóstico de gastos + Cron semanal

**Tipo:** HITL — requiere `CRON_SECRET` y configurar Vercel Cron / deploy.
**Triage:** `ready-for-agent`

## Parent
PRD: [`../PRD-fase2.md`](../PRD-fase2.md) — ERP YOU · Fase 2

## What to build
Cerrar el Módulo 4 con la **proyección de gastos recurrentes** y la **ejecución automática semanal**
del pronóstico vía Vercel Cron. Se agrega `PronosticoGasto` y el endpoint `api/cron/forecast`.

Comportamiento end-to-end: como OPERATIVO ves los **gastos proyectados** por periodicidad
(a partir de los gastos históricos por categoría/periodicidad), ajustables antes de confirmar.
Además, el pronóstico de ventas + compras se **regenera solo cada semana** mediante un Vercel Cron
(`0 6 * * 1`) que invoca `api/cron/forecast`, autenticado con `CRON_SECRET` por header `Bearer`.

## Acceptance criteria
- [ ] Modelo `PronosticoGasto` (categoriaGastoId, monto proyectado, periodicidad) y proyección desde gastos históricos por periodicidad.
- [ ] UI de gastos proyectados con ajuste manual antes de confirmar.
- [ ] Endpoint `api/cron/forecast` que regenera el pronóstico semanal y valida `CRON_SECRET` (`Authorization: Bearer …`); rechaza sin secreto.
- [ ] `vercel.json` con `crons: [{ path: "/api/cron/forecast", schedule: "0 6 * * 1" }]`.
- [ ] `CRON_SECRET` documentado en `.env.example`.
- [ ] **Verificación manual (HITL):** invocar el endpoint con el secreto (curl) genera/actualiza el pronóstico; sin el secreto responde 401.

## Blocked by
- F2·11 · [Pronóstico de ventas + explosión de compras](f2-11-pronostico-ventas-bom.md)
- F2·9 · [Gastos y estado de resultados](f2-09-gastos-estado-resultados.md)
