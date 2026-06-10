// Aumenta los tipos de Auth.js v5 con los campos propios del ERP.
// El id del usuario viaja en el claim estándar `token.sub` (no necesita aumento).
import type { DefaultSession } from "next-auth";
import type { Modulo, Rol } from "@/lib/erp/rbac";

declare module "next-auth" {
  interface Session {
    user: {
      /// Id del `User` en la BD (vacío si la sesión quedó invalidada).
      id: string;
      /// Administrador del ERP (super-usuario).
      esAdmin: boolean;
      /// Rol por módulo.
      roles: { modulo: Modulo; rol: Rol }[];
      /// Ids de las tiendas a las que está limitado (vacío = sin restricción).
      tiendas: string[];
    } & DefaultSession["user"];
  }
}
