"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { signOut } from "@/lib/erp/auth.server";
import { requireUser } from "@/lib/erp/session.server";
import { TIENDA_COOKIE } from "./constants";

/// Cierra la sesión y vuelve a /login (signOut lanza el redirect).
export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

/// Cambia la tienda activa. La autorización real por tienda se valida en cada
/// acción con `requireCan(modulo, accion, tiendaId)`; esto solo recuerda el contexto.
export async function setTienda(formData: FormData) {
  await requireUser();
  const tiendaId = String(formData.get("tiendaId") ?? "");
  const jar = await cookies();
  jar.set(TIENDA_COOKIE, tiendaId, { path: "/", sameSite: "lax" });
  revalidatePath("/", "layout");
}
