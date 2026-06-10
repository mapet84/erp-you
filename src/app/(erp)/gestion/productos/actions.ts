"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";

export interface ProductoState {
  ok?: boolean;
  error?: string;
}

const dec = z.string().trim().refine((v) => v !== "" && !Number.isNaN(Number(v)) && Number(v) >= 0, "Número inválido");
const crearSchema = z.object({
  codigo: z.string().trim().min(1),
  descripcion: z.string().trim().min(1),
  categoriaId: z.string().min(1),
  unidadId: z.string().min(1),
  costo: dec,
});

export async function crearProducto(_prev: ProductoState, formData: FormData): Promise<ProductoState> {
  await requireCan("GESTION", "configure");
  const parsed = crearSchema.safeParse({
    codigo: formData.get("codigo"),
    descripcion: formData.get("descripcion"),
    categoriaId: formData.get("categoriaId"),
    unidadId: formData.get("unidadId"),
    costo: formData.get("costo") || "0",
  });
  if (!parsed.success) return { error: "Revisa los campos." };
  try {
    await prisma.producto.create({
      data: {
        codigo: parsed.data.codigo.toUpperCase(),
        descripcion: parsed.data.descripcion,
        categoriaId: parsed.data.categoriaId,
        unidadId: parsed.data.unidadId,
        costo: parsed.data.costo,
      },
    });
  } catch {
    return { error: "Ya existe un producto con ese código." };
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
