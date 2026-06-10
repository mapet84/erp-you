"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/erp/session.server";
import { MODULOS, type Modulo, type Rol } from "@/lib/erp/rbac";

export interface UsuarioState {
  ok?: boolean;
  error?: string;
}

const ROLES_VALIDOS = ["CONFIGURADOR", "OPERATIVO", "LECTOR"] as const;

const crearSchema = z.object({
  email: z.string().email("Correo inválido"),
  nombre: z.string().trim().min(1, "Nombre requerido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export async function crearUsuario(
  _prev: UsuarioState,
  formData: FormData,
): Promise<UsuarioState> {
  await requireAdmin();

  const parsed = crearSchema.safeParse({
    email: formData.get("email"),
    nombre: formData.get("nombre"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los campos." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  try {
    await prisma.user.create({
      data: {
        email: parsed.data.email.toLowerCase().trim(),
        nombre: parsed.data.nombre,
        passwordHash,
        esAdmin: formData.get("esAdmin") === "on",
      },
    });
  } catch {
    return { error: "Ya existe un usuario con ese correo." };
  }

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

/// Guarda el detalle de un usuario: datos, esAdmin/activo, roles por módulo,
/// tiendas y (opcional) nueva contraseña. Reemplaza roles y tiendas por completo.
export async function guardarUsuario(
  _prev: UsuarioState,
  formData: FormData,
): Promise<UsuarioState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!id || !nombre) return { error: "Faltan datos." };

  const esAdmin = formData.get("esAdmin") === "on";
  const activo = formData.get("activo") === "on";
  const password = String(formData.get("password") ?? "");

  if (password && password.length < 8) {
    return { error: "La nueva contraseña debe tener al menos 8 caracteres." };
  }

  // Roles por módulo: rol_<MODULO> = "" | CONFIGURADOR | OPERATIVO | LECTOR
  const nuevosRoles: { modulo: Modulo; rol: Rol }[] = [];
  for (const modulo of MODULOS) {
    const v = String(formData.get(`rol_${modulo}`) ?? "");
    if (v && (ROLES_VALIDOS as readonly string[]).includes(v)) {
      nuevosRoles.push({ modulo, rol: v as Rol });
    }
  }

  // Tiendas asignadas (checkboxes con name="tiendas").
  const tiendaIds = formData.getAll("tiendas").map(String).filter(Boolean);

  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { nombre, esAdmin, activo, ...(passwordHash ? { passwordHash } : {}) },
    }),
    prisma.userModuleRole.deleteMany({ where: { userId: id } }),
    prisma.userModuleRole.createMany({
      data: nuevosRoles.map((r) => ({ userId: id, modulo: r.modulo, rol: r.rol })),
    }),
    prisma.userStore.deleteMany({ where: { userId: id } }),
    prisma.userStore.createMany({
      data: tiendaIds.map((tiendaId) => ({ userId: id, tiendaId })),
    }),
  ]);

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${id}`);
  return { ok: true };
}
