"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCan, requireAdmin } from "@/lib/erp/session.server";
import { siguienteCodigoIngrediente } from "@/lib/erp/codigos.server";

export interface IngredienteState {
  ok?: boolean;
  error?: string;
}

const decimal = z
  .string()
  .trim()
  .refine((v) => v !== "" && !Number.isNaN(Number(v)) && Number(v) >= 0, "Número inválido");

const crearSchema = z.object({
  nombre: z.string().trim().min(1),
  unidadId: z.string().min(1),
  costoCompra: decimal,
  minCompra: decimal,
});

export async function crearIngrediente(
  _prev: IngredienteState,
  formData: FormData,
): Promise<IngredienteState> {
  await requireCan("GESTION", "configure");

  const parsed = crearSchema.safeParse({
    nombre: formData.get("nombre"),
    unidadId: formData.get("unidadId"),
    costoCompra: formData.get("costoCompra"),
    minCompra: formData.get("minCompra") || "0",
  });
  if (!parsed.success) return { error: "Revisa los campos (nombre, unidad y costo)." };

  try {
    // Código consecutivo automático (100001–199999).
    const codigo = await siguienteCodigoIngrediente();
    await prisma.ingrediente.create({
      data: {
        codigo,
        nombre: parsed.data.nombre,
        unidadId: parsed.data.unidadId,
        costoCompra: parsed.data.costoCompra,
        minCompra: parsed.data.minCompra,
      },
    });
  } catch {
    return { error: "No se pudo crear el ingrediente." };
  }
  revalidatePath("/gestion/ingredientes");
  return { ok: true };
}

/// Edita el costo de compra de un ingrediente (la repreciación de recetas vive
/// en la rebanada #5). El CPM por tienda solo cambia con compras (#6).
export async function actualizarCostoCompra(formData: FormData): Promise<void> {
  await requireCan("GESTION", "configure");
  const id = String(formData.get("id") ?? "");
  const valor = String(formData.get("costoCompra") ?? "");
  if (!id || Number.isNaN(Number(valor)) || Number(valor) < 0) return;
  await prisma.ingrediente.update({ where: { id }, data: { costoCompra: valor } });
  revalidatePath("/gestion/ingredientes");
}

const editarSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().trim().min(1),
  unidadId: z.string().min(1),
  costoCompra: decimal,
  minCompra: decimal,
});

/// Edita un ingrediente (nombre, unidad, costo, mínimo). El código no cambia.
export async function editarIngrediente(_prev: IngredienteState, formData: FormData): Promise<IngredienteState> {
  await requireCan("GESTION", "configure");
  const parsed = editarSchema.safeParse({
    id: formData.get("id"),
    nombre: formData.get("nombre"),
    unidadId: formData.get("unidadId"),
    costoCompra: formData.get("costoCompra"),
    minCompra: formData.get("minCompra") || "0",
  });
  if (!parsed.success) return { error: "Revisa los campos." };
  await prisma.ingrediente.update({
    where: { id: parsed.data.id },
    data: { nombre: parsed.data.nombre, unidadId: parsed.data.unidadId, costoCompra: parsed.data.costoCompra, minCompra: parsed.data.minCompra },
  });
  revalidatePath("/gestion/ingredientes");
  return { ok: true };
}

/// Elimina un ingrediente (solo admin). FK-safe: si está en recetas/inventario, no borra.
export async function borrarIngrediente(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) { try { await prisma.ingrediente.delete({ where: { id } }); } catch { /* en uso */ } }
  revalidatePath("/gestion/ingredientes");
}

/// Borrado masivo de ingredientes seleccionados (solo admin). Omite los que estén en uso.
export async function borrarIngredientesMasivo(formData: FormData): Promise<void> {
  await requireAdmin();
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  for (const id of ids) {
    try { await prisma.ingrediente.delete({ where: { id } }); } catch { /* en uso, se omite */ }
  }
  revalidatePath("/gestion/ingredientes");
}
