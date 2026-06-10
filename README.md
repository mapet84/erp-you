# ERP YOU — Portal de Autofacturación CFDI 4.0 (Fase 1)

ERP por fases para restaurantes, cafeterías, panaderías y negocios con inventario.
**Fase 1:** portal público de autofacturación CFDI 4.0 multi-tenant (un emisor por `slug`).

Stack: **Next.js 16 (App Router) + TypeScript · Prisma + Postgres · Tailwind v4 + shadcn/ui · Zod · Vitest**.

## Requisitos

- Node 20+ y npm
- Docker (para Postgres local)

## Levantar en local

```bash
# 1. Instala dependencias
npm install

# 2. Levanta Postgres (docker compose)
npm run db:up

# 3. Aplica migraciones y genera el cliente Prisma
npm run db:migrate:dev      # primera vez (crea/aplica migraciones)
# en una BD ya migrada basta: npm run db:migrate

# 4. Siembra el emisor demo
npm run db:seed

# 5. Arranca la app
npm run dev
```

Abre:

- http://localhost:3000 — landing
- http://localhost:3000/f/demo — portal del emisor demo (**activo**)
- http://localhost:3000/f/inactivo — emisor inactivo → **404**
- http://localhost:3000/f/loquesea — slug inexistente → **404**

La conexión a Postgres se configura en `.env` (`DATABASE_URL`); ver `.env.example`.

## Tests

```bash
npm run test        # vitest run (una vez)
npm run test:watch  # modo watch
```

## Scripts útiles

| Script | Qué hace |
|--------|----------|
| `npm run dev` | App en modo desarrollo |
| `npm run db:up` / `db:down` | Levanta / baja Postgres (docker compose) |
| `npm run db:migrate:dev` | Crea y aplica migraciones (desarrollo) |
| `npm run db:migrate` | Aplica migraciones existentes (deploy) |
| `npm run db:seed` | Siembra datos demo |
| `npm run db:reset` | Resetea la BD y re-siembra |
| `npm run test` | Corre los tests |

## Estructura (slice #1)

```
prisma/
  schema.prisma        # modelo Emisor (tenant)
  seed.ts              # emisor demo (activo) + inactivo
  migrations/          # migración init
src/
  app/
    page.tsx           # landing
    f/[slug]/page.tsx  # portal público por tenant (404 si no existe/inactivo)
  components/ui/       # card (shadcn/ui)
  lib/
    db.ts              # singleton Prisma
    emisor.ts          # lógica pura de tenant (testeable)
    utils.ts           # cn()
  test/                # tests de la lógica pura
```

## Roadmap

Ver [`PRD.md`](PRD.md) y los slices en [`issues/`](issues/) (`issues/00-INDEX.md`).
Slice #1 (este) deja el esqueleto + resolución de tenant. Siguiente: #2 (alta de emisor
por CLI + `facturama-client`, HITL — requiere credenciales sandbox de Facturama y un CSD).
