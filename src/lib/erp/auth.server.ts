// Configuración de Auth.js v5 (NextAuth) para el ERP — Fase 2 · rebanada #1.
//
// Autenticación por CREDENCIALES (correo + contraseña) con sesión JWT.
// Nota de diseño: el proveedor Credentials de Auth.js v5 NO admite la estrategia
// de sesión "database"; solo "jwt". Por eso gestionamos los usuarios nosotros
// (consulta directa a Prisma en `authorize`) y reflejamos roles/desactivación
// revalidando contra la BD en el callback `session` (en cada request).
//
// Corre en runtime Node (route handler + server components); por eso es seguro
// usar bcrypt y Prisma aquí. El gate de presencia de sesión vive en `proxy.ts`.

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const credencialesSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Necesario detrás de proxies/hosts (local + Vercel) para Auth.js v5.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credencialesSchema.safeParse(raw);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email } });
        // Usuario inexistente o desactivado → rechazo (sin filtrar cuál es).
        if (!user || !user.activo) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.nombre };
      },
    }),
  ],
  callbacks: {
    // Auth.js guarda el id del usuario en el claim estándar `token.sub`.
    async session({ session, token }) {
      const uid = token.sub;
      if (!uid || !session.user) return session;

      // Revalida contra la BD en cada request: refleja desactivación y trae los
      // roles por módulo + tiendas para que `can()` no haga consultas extra.
      const user = await prisma.user.findUnique({
        where: { id: uid },
        select: {
          id: true,
          activo: true,
          nombre: true,
          email: true,
          esAdmin: true,
          moduleRoles: { select: { modulo: true, rol: true } },
          stores: { select: { tiendaId: true } },
        },
      });
      if (!user || !user.activo) {
        session.user.id = "";
        return session;
      }
      session.user.id = user.id;
      session.user.name = user.nombre;
      session.user.email = user.email;
      session.user.esAdmin = user.esAdmin;
      session.user.roles = user.moduleRoles;
      session.user.tiendas = user.stores.map((s) => s.tiendaId);
      return session;
    },
  },
});
