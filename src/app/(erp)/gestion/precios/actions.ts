"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { precioDesdeMargen } from "@/lib/erp/pricing";
import { costoRecetaArbol } from "@/lib/erp/costeo";
import { componentesCompraDeReceta } from "@/lib/erp/costeo.server";

/// Guarda manualmente el precio (con IVA) de una receta en un canal.
export async function guardarPrecioReceta(formData: FormData): Promise<void> {
  await requireCan("GESTION", "configure");
  const recetaId = String(formData.get("recetaId") ?? "");
  const canalId = String(formData.get("canalId") ?? "");
  const precio = String(formData.get("precio") ?? "");
  if (!recetaId || !canalId || Number.isNaN(Number(precio)) || Number(precio) < 0) return;
  await prisma.precioReceta.upsert({
    where: { recetaId_canalId: { recetaId, canalId } },
    update: { precio },
    create: { recetaId, canalId, precio },
  });
  revalidatePath("/gestion/precios");
}

async function repreciarRecetaInterno(recetaId: string): Promise<number> {
  const receta = await prisma.receta.findUnique({ where: { id: recetaId }, select: { categoriaId: true } });
  if (!receta) return 0;
  const costo = costoRecetaArbol(await componentesCompraDeReceta(recetaId));
  const margenes = await prisma.margenObjetivo.findMany({ where: { categoriaId: receta.categoriaId } });
  for (const m of margenes) {
    const precio = precioDesdeMargen(costo, m.margen).toString();
    await prisma.precioReceta.upsert({
      where: { recetaId_canalId: { recetaId, canalId: m.canalId } },
      update: { precio },
      create: { recetaId, canalId: m.canalId, precio },
    });
  }
  return margenes.length;
}

/// Repreciar una receta al precio sugerido por su margen objetivo (todos los canales).
export async function repreciarReceta(formData: FormData): Promise<void> {
  await requireCan("GESTION", "configure");
  const recetaId = String(formData.get("recetaId") ?? "");
  if (recetaId) await repreciarRecetaInterno(recetaId);
  revalidatePath("/gestion/precios");
}

/// Repreciar TODAS las recetas a su margen objetivo.
export async function repreciarTodo(): Promise<void> {
  await requireCan("GESTION", "configure");
  const recetas = await prisma.receta.findMany({ select: { id: true } });
  for (const r of recetas) await repreciarRecetaInterno(r.id);
  revalidatePath("/gestion/precios");
}
