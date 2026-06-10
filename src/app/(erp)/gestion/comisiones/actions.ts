"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";

/// Define/actualiza la comisión (%) de un (canal, medio de pago).
export async function guardarComision(formData: FormData): Promise<void> {
  await requireCan("GESTION", "configure");
  const canalId = String(formData.get("canalId") ?? "");
  const medioPagoId = String(formData.get("medioPagoId") ?? "");
  const valor = String(formData.get("comisionPct") ?? "");
  const n = Number(valor);
  if (!canalId || !medioPagoId || Number.isNaN(n) || n < 0 || n > 100) return;
  await prisma.comision.upsert({
    where: { canalId_medioPagoId: { canalId, medioPagoId } },
    update: { comisionPct: valor },
    create: { canalId, medioPagoId, comisionPct: valor },
  });
  revalidatePath("/gestion/comisiones");
}
