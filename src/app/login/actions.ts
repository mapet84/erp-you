"use server";

// Server Action de inicio de sesión del ERP. Llama a Auth.js (Credentials).
// En éxito, `signIn` lanza un redirect (NEXT_REDIRECT) que se re-lanza; ante
// credenciales inválidas, Auth.js lanza `AuthError` y devolvemos el mensaje.

import { AuthError } from "next-auth";
import { signIn } from "@/lib/erp/auth.server";

export interface LoginState {
  error?: string;
}

/// Acepta solo rutas internas ("/algo"); cualquier otra cosa cae a /dashboard.
function destinoSeguro(next: unknown): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/dashboard";
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = destinoSeguro(formData.get("next"));

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Correo o contraseña incorrectos." };
    }
    throw error; // redirect u otros: re-lanzar para que Next lo maneje.
  }
  return {};
}
