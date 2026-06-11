"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCan, requireAdmin } from "@/lib/erp/session.server";
import { siguienteCodigoProducto } from "@/lib/erp/codigos.server";

/// Elimina un producto (solo admin). FK-safe.
export async function borrarProducto(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) { try { await prisma.producto.delete({ where: { id } }); } catch { /* en uso */ } }
  revalidatePath("/gestion/productos");
}

export interface ProductoState {
  ok?: boolean;
  error?: string;
}

const dec = z.string().trim().refine((v) => v !== "" && !Number.isNaN(Number(v)) && Number(v) >= 0, "Número inválido");
const crearSchema = z.object({
  descripcion: z.string().trim().min(1),
  categoriaId: z.string().min(1),
  unidadId: z.string().min(1),
  costo: dec,
});

export async function crearProducto(_prev: ProductoState, formData: FormData): Promise<ProductoState> {
  await requireCan("GESTION", "configure");
  const parsed = crearSchema.safeParse({
    descripcion: formData.get("descripcion"),
    categoriaId: formData.get("categoriaId"),
    unidadId: formData.get("unidadId"),
    costo: formData.get("costo") || "0",
  });
  if (!parsed.success) return { error: "Revisa los campos (descripción, categoría, unidad)." };
  try {
    const codigo = await siguienteCodigoProducto(parsed.data.categoriaId);
    await prisma.producto.create({
      data: {
        codigo,
        descripcion: parsed.data.descripcion,
        categoriaId: parsed.data.categoriaId,
        unidadId: parsed.data.unidadId,
        costo: parsed.data.costo,
      },
    });
  } catch {
    return { error: "No se pudo crear el producto." };
  }
  revalidatePath("/gestion/productos");
  return { ok: true };
}

/// Precio de venta (con IVA) de un producto en un canal.
export async function guardarPrecioProducto(formData: FormData): Promise<void> {
  await requireCan("GESTION", "configure");
  const productoId = String(formData.get("productoId") ?? "");
  const canalId = String(formData.get("canalId") ?? "");
  const precio = String(formData.get("precio") ?? "");
  if (!productoId || !canalId || Number.isNaN(Number(precio)) || Number(precio) < 0) return;
  await prisma.productoPrecio.upsert({
    where: { productoId_canalId: { productoId, canalId } },
    update: { precio },
    create: { productoId, canalId, precio },
  });
  revalidatePath("/gestion/productos");
}
