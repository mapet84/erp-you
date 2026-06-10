"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/erp/session.server";

export interface TiendaState {
  ok?: boolean;
  error?: string;
}

const tiendaSchema = z.object({
  codigo: z.string().trim().min(1).max(20),
  nombre: z.string().trim().min(1),
  direccion: z.string().trim().optional(),
});

export async function crearTienda(
  _prev: TiendaState,
  formData: FormData,
): Promise<TiendaState> {
  await requireAdmin();

  const parsed = tiendaSchema.safeParse({
    codigo: formData.get("codigo"),
    nombre: formData.get("nombre"),
    direccion: formData.get("direccion") || undefined,
  });
  if (!parsed.success) return { error: "Código y nombre son obligatorios." };

  try {
    await prisma.tienda.create({
      data: {
        codigo: parsed.data.codigo.toUpperCase(),
        nombre: parsed.data.nombre,
        direccion: parsed.data.direccion ?? null,
      },
    });
  } catch {
    return { error: "Ya existe una tienda con ese código." };
  }

  revalidatePath("/admin/tiendas");
  return { ok: true };
}

/// Activa/desactiva una tienda (no se borra: preserva historial transaccional).
export async function toggleTienda(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const tienda = await prisma.tienda.findUnique({ where: { id } });
  if (tienda) {
    await prisma.tienda.update({
      where: { id },
      data: { activo: !tienda.activo },
    });
  }
  revalidatePath("/admin/tiendas");
}
