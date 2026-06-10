"use server";

import { signOut } from "@/lib/erp/auth.server";

/// Cierra la sesión y vuelve a /login (signOut lanza el redirect).
export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
