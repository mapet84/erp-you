// Aumenta los tipos de Auth.js v5 con los campos propios del ERP.
// El id del usuario viaja en el claim estándar `token.sub` (no necesita aumento).
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /// Id del `User` en la BD (vacío si la sesión quedó invalidada).
      id: string;
    } & DefaultSession["user"];
  }
}
