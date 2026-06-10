// Autorización del ERP (módulo puro, sin BD ni red). Concentra la matriz de
// permisos por módulo, rol y tienda. Lo consumen los 3 guards (proxy solo mira
// presencia de sesión; las páginas y server actions llaman a `can`/`requireCan`).

/// Los 4 módulos del ERP (mismos identificadores que el enum `Modulo` de Prisma).
export type Modulo = "GESTION" | "POS" | "FINANZAS" | "PRONOSTICOS";
export const MODULOS: readonly Modulo[] = [
  "GESTION",
  "POS",
  "FINANZAS",
  "PRONOSTICOS",
];

/// Roles dentro de un módulo (mismos identificadores que el enum `Rol`).
export type Rol = "CONFIGURADOR" | "OPERATIVO" | "LECTOR";

/// Acciones autorizables. read = ver; write = transacciones del día a día;
/// configure = datos maestros, precios, configuración y asignación de roles.
export type Accion = "read" | "write" | "configure";

/// Acciones que concede cada rol (jerárquico: configure ⊃ write ⊃ read).
const ACCIONES_POR_ROL: Record<Rol, ReadonlySet<Accion>> = {
  LECTOR: new Set<Accion>(["read"]),
  OPERATIVO: new Set<Accion>(["read", "write"]),
  CONFIGURADOR: new Set<Accion>(["read", "write", "configure"]),
};

/// Vista de autorización del usuario que viaja en la sesión (sin secretos).
export interface AuthzUser {
  /// Administrador del ERP: acceso total a todo módulo, acción y tienda.
  esAdmin: boolean;
  /// Rol por módulo (a lo sumo uno por módulo).
  roles: ReadonlyArray<{ modulo: Modulo; rol: Rol }>;
  /// Tiendas a las que está limitado. Vacío = sin restricción de tienda
  /// (todas) para CONFIGURADOR/admin; para OPERATIVO/LECTOR, vacío = ninguna.
  tiendas: ReadonlyArray<string>;
}

/// Rol del usuario en un módulo, o `null` si no tiene acceso a ese módulo.
export function rolEnModulo(user: AuthzUser, modulo: Modulo): Rol | null {
  return user.roles.find((r) => r.modulo === modulo)?.rol ?? null;
}

/// ¿El usuario puede actuar sobre `tiendaId` en este módulo?
/// - admin → cualquier tienda.
/// - CONFIGURADOR sin tiendas asignadas → todas; con tiendas → solo esas.
/// - OPERATIVO/LECTOR → solo sus tiendas asignadas (vacío = ninguna).
export function puedeEnTienda(
  user: AuthzUser,
  modulo: Modulo,
  tiendaId: string,
): boolean {
  if (user.esAdmin) return true;
  const rol = rolEnModulo(user, modulo);
  if (!rol) return false;
  if (rol === "CONFIGURADOR" && user.tiendas.length === 0) return true;
  return user.tiendas.includes(tiendaId);
}

/// ¿Puede el usuario ejecutar `accion` en `modulo` (opcionalmente sobre una
/// tienda concreta)? Sin `tiendaId` se evalúa una acción no ligada a tienda
/// (p. ej. editar catálogo/maestros compartidos).
export function can(
  user: AuthzUser,
  modulo: Modulo,
  accion: Accion,
  tiendaId?: string,
): boolean {
  if (user.esAdmin) return true;

  const rol = rolEnModulo(user, modulo);
  if (!rol) return false;
  if (!ACCIONES_POR_ROL[rol].has(accion)) return false;

  if (tiendaId !== undefined) return puedeEnTienda(user, modulo, tiendaId);
  return true;
}

/// Módulos que el usuario puede al menos leer (para el nav y el dashboard).
export function modulosVisibles(user: AuthzUser): Modulo[] {
  return MODULOS.filter((m) => can(user, m, "read"));
}
