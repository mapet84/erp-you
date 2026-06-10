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

## ERP · Fase 2 (en construcción)

El ERP operativo de 4 módulos (Gestión, POS, Finanzas, Pronósticos) se construye en el
esquema Postgres `erp` (separado del portal CFDI, que vive en `public`). Ver
[`PRD-fase2.md`](PRD-fase2.md) y los issues `issues/f2-*.md` (`issues/f2-00-INDEX.md`).

**Rebanada #1 — Login al ERP (lista):** autenticación por credenciales (Auth.js v5, sesión
JWT, bcrypt). Para entrar:

```bash
# 1. Pon un AUTH_SECRET en .env  (genera uno con: npx auth secret)
# 2. Aplica migraciones (crea el esquema erp + tabla usuarios)
npm run db:migrate:dev
# 3. Crea el primer administrador
npm run usuario:alta -- --email admin@empresa.mx --nombre "Admin" --password "secreta123"
# 4. Arranca e inicia sesión
npm run dev
```

- http://localhost:3000/login — inicio de sesión del ERP
- http://localhost:3000/dashboard — panel (requiere sesión; sin ella redirige a /login)

El portal de Fase 1 (`/f/demo`) sigue funcionando igual.

> Nota de diseño: el proveedor Credentials de Auth.js v5 solo admite sesión **JWT** (no
> "database"); los usuarios se gestionan en la tabla `erp.usuarios` y la desactivación se
> aplica revalidando contra la BD en cada request (callback `session`).

## Roadmap

Ver [`PRD.md`](PRD.md) (Fase 1) y [`PRD-fase2.md`](PRD-fase2.md) (Fase 2). Slices de Fase 1 en
`issues/00-INDEX.md` (completos); slices de Fase 2 en `issues/f2-00-INDEX.md`.
Siguiente tras #1: **#2 — Usuarios, tiendas y permisos (RBAC por módulo y tienda)**.
