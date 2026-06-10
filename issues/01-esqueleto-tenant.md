# 1 · Esqueleto + resolución de tenant

**Tipo:** AFK

## Parent
PRD: [`../PRD.md`](../PRD.md) — ERP YOU · Fase 1: Portal de Autofacturación CFDI 4.0

## What to build
El walking skeleton del proyecto y la resolución de tenant por slug. Se levanta el stack
(Next.js App Router + TypeScript, Tailwind + shadcn/ui, Prisma + Postgres en `docker compose`,
Vitest, Zod) y se entrega el primer camino vertical: un `Emisor` sembrado en la BD se resuelve
y renderiza en su portal público `/f/[slug]`.

Comportamiento end-to-end: al visitar `/f/[slug]` de un emisor existente se ve su nombre/marca;
un slug inexistente devuelve 404. La pieza prueba que schema → consulta → página funcionan juntos.

## Acceptance criteria
- [x] `docker compose up` levanta Postgres y la app arranca con `npm run dev`.
- [x] Schema Prisma con el modelo `Emisor` (al menos: id, slug, rfc, razónSocial, branding, activo) y migración aplicada.
- [x] Seed que crea 1 emisor de demo con un slug conocido.
- [x] `/f/[slug]` renderiza el nombre/marca del emisor sembrado.
- [x] `/f/[slug]` con slug inexistente o emisor inactivo devuelve 404.
- [x] Vitest configurado con al menos un test verde.
- [x] README con pasos para levantar local (docker, migrate, seed, dev).

## Estado
**COMPLETADO** (2026-06-10, AFK). Verificado end-to-end: `/f/demo` → 200 con marca;
`/f/inactivo` y slug inexistente → 404; `npm run test` → 6 tests verdes.
Nota técnica: se fijó Prisma a v6 (v7 ya no admite `url` en el schema; requiere
`prisma.config.ts` + driver adapter — se difiere esa migración).

## Blocked by
None - can start immediately
