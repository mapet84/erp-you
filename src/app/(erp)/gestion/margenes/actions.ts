"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";

/// Guarda TODOS los márgenes objetivo de la sección en un solo envío.
/// Campo por celda: `m_<categoriaId>_<canalId>`. Vacío = se elimina; valor
/// válido (0–99.99) = upsert.
export async function guardarMargenes(formData: FormData): Promise<void> {
  await requireCan("GESTION", "configure");
  const [categorias, canales] = await Promise.all([
    prisma.categoria.findMany({ select: { id: true } }),
    prisma.canal.findMany({ select: { id: true } }),
  ]);

  const ops = [];
  for (const c of categorias) {
    for (const ca of canales) {
      const raw = String(formData.get(`m_${c.id}_${ca.id}`) ?? "").trim().replace(",", ".");
      const where = { categoriaId_canalId: { categoriaId: c.id, canalId: ca.id } };
      if (raw === "") {
        ops.push(prisma.margenObjetivo.deleteMany({ where: { categoriaId: c.id, canalId: ca.id } }));
        continue;
      }
      const n = Number(raw);
      if (Number.isNaN(n) || n < 0 || n >= 100) continue;
      ops.push(prisma.margenObjetivo.upsert({ where, update: { margen: raw }, create: { categoriaId: c.id, canalId: ca.id, margen: raw } }));
    }
  }
  await prisma.$transaction(ops);
  revalidatePath("/gestion/margenes");
  revalidatePath("/gestion/recetas");
  revalidatePath("/gestion/precios");
}
