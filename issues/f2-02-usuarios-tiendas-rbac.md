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
- [ ] Modelos `Tienda`, `UserModuleRole` (`@@unique([userId,modulo])`) y `UserStore` (`@@unique([userId,tiendaId])`) con enums `Modulo{GESTION,POS,FINANZAS,PRONOSTICOS}` y `Rol{CONFIGURADOR,OPERATIVO,LECTOR}`.
- [ ] Módulo puro `rbac.can(user, modulo, accion, tiendaId?)` con su matriz y la regla de scope por tienda.
- [ ] `session.server` enriquece la sesión con `moduleRoles` + `stores` para que `can()` no haga consultas extra.
- [ ] Pantallas `admin/tiendas` (CRUD) y `admin/usuarios` (alta/edición, asignar rol por módulo, asignar tiendas, activar/desactivar) — solo accesibles a CONFIGURADOR.
- [ ] Guard en cada página del grupo `(erp)` y en cada server action mutante; acceso a módulo sin rol → 403; escritura sin permiso → `State{error}`.
- [ ] Selector de tienda en la barra para usuarios con varias tiendas; tienda fija si solo tiene una.
- [ ] **Tests** de `rbac`: matriz completa rol×acción, scope por tienda (incluye default de CONFIGURADOR), módulo sin rol = deny.
- [ ] **Verificable:** un usuario OPERATIVO-en-POS-1-tienda solo ve POS y recibe 403 en Finanzas; un LECTOR no puede escribir.

## Blocked by
- F2·1 · [Login al ERP (esqueleto vertical)](f2-01-login-esqueleto.md)
