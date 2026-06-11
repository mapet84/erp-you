"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";

/// Guarda TODAS las comisiones de la sección en un solo envío.
/// Campo por celda: `c_<canalId>_<medioPagoId>`. Vacío = se elimina; valor (0–100) = upsert.
export async function guardarComisiones(formData: FormData): Promise<void> {
  await requireCan("GESTION", "configure");
  const [canales, medios] = await Promise.all([
    prisma.canal.findMany({ select: { id: true } }),
    prisma.medioPago.findMany({ select: { id: true } }),
  ]);

  const ops = [];
  for (const ca of canales) {
    for (const m of medios) {
      const raw = String(formData.get(`c_${ca.id}_${m.id}`) ?? "").trim().replace(",", ".");
      if (raw === "") {
        ops.push(prisma.comision.deleteMany({ where: { canalId: ca.id, medioPagoId: m.id } }));
        continue;
      }
      const n = Number(raw);
      if (Number.isNaN(n) || n < 0 || n > 100) continue;
      ops.push(prisma.comision.upsert({ where: { canalId_medioPagoId: { canalId: ca.id, medioPagoId: m.id } }, update: { comisionPct: raw }, create: { canalId: ca.id, medioPagoId: m.id, comisionPct: raw } }));
    }
  }
  await prisma.$transaction(ops);
  revalidatePath("/gestion/comisiones");
}
