// Helpers de sesión y autorización del ERP (runtime Node). Envuelven el módulo
// puro `rbac` con la sesión de Auth.js y los cortes de Next (redirect/forbidden).

import { redirect, forbidden } from "next/navigation";
import { auth } from "@/lib/erp/auth.server";
import { can, type Accion, type AuthzUser, type Modulo } from "@/lib/erp/rbac";

export interface SessionUser extends AuthzUser {
  id: string;
  nombre: string;
  email: string;
}

/// Devuelve el usuario autenticado o `null`. Una sesión invalidada (usuario
/// desactivado/borrado) tiene id vacío y se trata como no autenticada.
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const u = session?.user;
  if (!u || !u.id) return null;
  return {
    id: u.id,
    nombre: u.name ?? "",
    email: u.email ?? "",
    esAdmin: u.esAdmin ?? false,
    roles: u.roles ?? [],
    tiendas: u.tiendas ?? [],
  };
}

/// Exige sesión; si no hay, redirige a /login.
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/// Exige sesión + permiso (`can`). Sin permiso → 403 (forbidden()). Úsalo al
/// inicio de cada página y server action del ERP.
export async function requireCan(
  modulo: Modulo,
  accion: Accion,
  tiendaId?: string,
): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user, modulo, accion, tiendaId)) forbidden();
  return user;
}

/// Exige ser administrador del ERP (gestión de usuarios/tiendas). Sin él → 403.
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.esAdmin) forbidden();
  return user;
}
