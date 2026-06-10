// Helpers de sesión del ERP (runtime Node). La autorización fina por módulo y
// tienda (`requireCan`) llega en la rebanada #2; aquí solo identidad.

import { redirect } from "next/navigation";
import { auth } from "@/lib/erp/auth.server";

export type SessionUser = {
  id: string;
  nombre: string;
  email: string;
};

/// Devuelve el usuario autenticado o `null`. Una sesión invalidada (usuario
/// desactivado/borrado) tiene id vacío y se trata como no autenticada.
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const u = session?.user;
  if (!u || !u.id) return null;
  return { id: u.id, nombre: u.name ?? "", email: u.email ?? "" };
}

/// Exige sesión; si no hay, redirige a /login. Úsalo al inicio de cada página
/// y server action del ERP.
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
