# F2·2 · Usuarios, tiendas y permisos

**Tipo:** AFK
**Triage:** `ready-for-agent`

## Parent
PRD: [`../PRD-fase2.md`](../PRD-fase2.md) — ERP YOU · Fase 2

## What to build
El módulo único de usuarios con RBAC **por módulo** y **por tienda**, y la administración de
tiendas. Se agregan los modelos `Tienda`, `UserModuleRole(user, modulo, rol)` y `UserStore(user,
tienda)`, y el módulo puro `rbac` que concentra la matriz de autorización. La autorización se
aplica en tres capas alrededor del mismo `can()`: middleware (solo sesión), guard en cada página
(`requireCan(modulo,"read",tienda?)`) y guard en cada server action antes de tocar la BD.

Comportamiento end-to-end: como admin (CONFIGURADOR) creas una **tienda** y un **usuario**, le
asignas rol `OPERATIVO` solo en el módulo POS y lo restringes a esa tienda; ese usuario inicia
sesión y **solo ve POS**, puede operar su tienda, y al intentar abrir Finanzas recibe **403**. Un
`LECTOR` ve pantallas pero no puede escribir. Un usuario con varias tiendas ve un **selector de
tienda** en la barra.

Matriz de roles (módulo `rbac`): `LECTOR`={read}, `OPERATIVO`={read,write},
`CONFIGURADOR`={read,write,configure}. Default de scope: `CONFIGURADOR` sin filas de tienda = todas;
`OPERATIVO`/`LECTOR` requieren ≥1 tienda.

## Acceptance criteria
- [x] Modelos `Tienda`, `UserModuleRole` (`@@unique([userId,modulo])`) y `UserStore` (`@@unique([userId,tiendaId])`) con enums `Modulo{GESTION,POS,FINANZAS,PRONOSTICOS}` y `Rol{CONFIGURADOR,OPERATIVO,LECTOR}`. Migración solo en esquema `erp`.
- [x] Módulo puro `rbac.can(user, modulo, accion, tiendaId?)` (+ `puedeEnTienda`, `modulosVisibles`) con su matriz y la regla de scope por tienda.
- [x] `session.server` enriquece la sesión con `roles` + `tiendas` + `esAdmin` (revalidados en el callback `session`) para que `can()` no haga consultas extra.
- [x] Pantallas `admin/tiendas` (alta + activar/desactivar) y `admin/usuarios` (alta + edición: rol por módulo, tiendas, activar/desactivar, admin) — solo **admin** (ver desviación).
- [x] Guard en cada página del ERP (`requireCan`/`requireAdmin`) y en cada server action mutante; acceso a módulo sin rol → **403** vía `forbidden()` (`experimental.authInterrupts` + `forbidden.tsx`); escritura sin permiso en acción → guard. Rutas placeholder `/gestion|/pos|/finanzas|/pronosticos` protegidas por `requireCan(read)`.
- [x] Selector de tienda en la barra (cookie) para usuarios con varias tiendas; fija si solo tiene una.
- [x] **Tests** de `rbac` (18): matriz completa rol×acción, scope por tienda (incl. default de CONFIGURADOR), módulo sin rol = deny, admin = acceso total, `modulosVisibles`.
- [x] **Verificable (e2e dev):** cajero OPERATIVO-en-POS-1-tienda → sesión con `roles:[{POS,OPERATIVO}]`+`tiendas:[T1]`; `/pos` 200, `/finanzas` **403**, `/gestion` **403**, `/admin/usuarios` **403**, `/dashboard` 200. Admin → `/finanzas`, `/admin/usuarios`, `/admin/tiendas` 200. **117 tests verdes**, `tsc`/`eslint`/`next build` limpios.

## Desviación respecto al plan (justificada)
El RBAC por módulo no define **quién administra el directorio de usuarios y las tiendas**. Se añade un
flag **`esAdmin`** en `User` (super-usuario): gestiona usuarios/tiendas y tiene acceso total a todo
módulo/tienda. Los guards de las pantallas de administración usan `requireAdmin()`. El primer admin se
crea con `npm run usuario:alta -- … --admin`. El borrado de tiendas se ofrece como **desactivar** (no
DELETE) para preservar el historial transaccional.

## Estado
**COMPLETADO (2026-06-10, AFK).** Verificado end-to-end contra la BD local.

## Blocked by
- F2·1 · [Login al ERP (esqueleto vertical)](f2-01-login-esqueleto.md)
