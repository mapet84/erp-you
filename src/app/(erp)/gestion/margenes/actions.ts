"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";

/// Define/actualiza el margen objetivo (%) de una (categoría, canal).
export async function guardarMargen(formData: FormData): Promise<void> {
  await requireCan("GESTION", "configure");
  const categoriaId = String(formData.get("categoriaId") ?? "");
  const canalId = String(formData.get("canalId") ?? "");
  const valor = String(formData.get("margen") ?? "");
  const n = Number(valor);
  if (!categoriaId || !canalId || Number.isNaN(n) || n < 0 || n >= 100) return;

  await prisma.margenObjetivo.upsert({
    where: { categoriaId_canalId: { categoriaId, canalId } },
    update: { margen: valor },
    create: { categoriaId, canalId, margen: valor },
  });
  revalidatePath("/gestion/margenes");
  revalidatePath("/gestion/recetas");
}
