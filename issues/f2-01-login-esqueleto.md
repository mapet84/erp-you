# F2·1 · Login al ERP (esqueleto vertical)

**Tipo:** HITL — requiere `AUTH_SECRET` y correr el CLI de alta del primer admin.
**Triage:** `ready-for-agent`

## Parent
PRD: [`../PRD-fase2.md`](../PRD-fase2.md) — ERP YOU · Fase 2

## What to build
El walking skeleton del ERP: habilitar el esquema `erp` separado del portal CFDI y entregar el
primer camino vertical de autenticación. Se habilita Prisma `multiSchema` (`schemas = ["public",
"erp"]`), los 4 modelos de Fase 1 quedan anotados con `@@schema("public")` y la migración inicial
**solo crea el esquema `erp`** sin recrear las tablas `public.*`. Se agregan los modelos de
identidad mínimos (`User` + tablas del adapter `Account`/`Session`/`VerificationToken`) y Auth.js v5
con proveedor de credenciales (bcrypt) y **sesiones en BD** vía `@auth/prisma-adapter`.

Comportamiento end-to-end: un admin sembrado por CLI inicia sesión en `/login` con correo y
contraseña, se crea su sesión en BD y aterriza en `(erp)/dashboard`; contraseña incorrecta falla
con mensaje claro; cerrar sesión funciona; el portal público de Fase 1 (`/f/demo`) sigue intacto.
Esto prueba que esquema → auth → middleware → página funcionan juntos.

El helper puro `money` (Decimal ↔ string para Client Components) se introduce aquí con su test,
porque será transversal a todas las rebanadas siguientes.

## Acceptance criteria
- [x] `schemas = ["public","erp"]` + `directUrl` en el datasource; `DATABASE_URL` + `DIRECT_URL` + `AUTH_SECRET` en `.env.example`. *(multiSchema ya es estable en Prisma 6.19; no requiere `previewFeatures`.)*
- [x] Modelos de Fase 1 anotados `@@schema("public")`; la migración generada **solo** hace `CREATE SCHEMA IF NOT EXISTS "erp"` + crea `erp.usuarios` (+ índice) — revisada antes de aplicar; no toca `public.*`.
- [x] Modelo `User` (id, email único, nombre, passwordHash, activo, timestamps) en `@@schema("erp")`. *(Ver desviación abajo: sin tablas `Account/Session/VerificationToken`.)*
- [x] Auth.js v5 con Credentials (bcrypt `compare`, rechaza usuario `activo=false`); ruta `api/auth/[...nextauth]`. **Sesión JWT** (ver desviación), con revalidación del usuario contra la BD en el callback `session`.
- [x] `proxy.ts` (renombre de `middleware` en Next 16) protege el ERP (matcher `/dashboard|/gestion|/pos|/finanzas|/pronosticos|/admin`); `/login`, `/`, `/f/`, `/factura/`, `/api/auth` quedan fuera: sin cookie de sesión → redirige a `/login`.
- [x] `/login` (top-level) y `(erp)/dashboard` con layout propio del ERP y flujo de inicio/cierre de sesión.
- [x] CLI `scripts/alta-usuario.ts` (espejo de `alta-emisor.ts`) crea/actualiza un usuario con contraseña hasheada; `npm run usuario:alta`; documentado en README.
- [x] Módulo puro `money` (Decimal↔string, formato MXN/%, serialización RSC) con tests verdes (8).
- [x] **Verificación (e2e, dev server):** login real → 302 → `/dashboard`; `/api/auth/session` devuelve el usuario con id; `/dashboard` sin sesión → 307 `/login`; contraseña mala → `/login?error=CredentialsSignin`; `/f/demo` sigue 200. **99 tests verdes**, `tsc`/`eslint`/`next build` limpios.

## Desviación respecto al plan (justificada)
El proveedor **Credentials de Auth.js v5 no admite la estrategia de sesión `database`**, solo **JWT**.
Por eso: sesión JWT (firmada con `AUTH_SECRET`), usuarios gestionados directo en `erp.usuarios`
(sin `PrismaAdapter` ni tablas `Account/Session/VerificationToken`), y la desactivación de usuario
se aplica revalidando contra la BD en el callback `session` (en cada request). El id viaja en el
claim estándar `token.sub`. Comportamiento y seguridad equivalentes a lo planeado; si más adelante
se requiere revocación de sesión del lado servidor, se puede cambiar a un cookie-session propio.

## Estado
**COMPLETADO (2026-06-10, AFK salvo el `AUTH_SECRET`).** Verificado end-to-end contra la BD local.
HITL pendiente para producción: definir un `AUTH_SECRET` propio y correr `usuario:alta` para el
primer admin (en local se sembró `admin@empresa.mx`).

## Blocked by
None - can start immediately
