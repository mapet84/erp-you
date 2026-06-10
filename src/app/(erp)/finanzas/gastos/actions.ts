"use server";

import type { Periodicidad } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Decimal } from "@/lib/erp/money";
import { requireCan } from "@/lib/erp/session.server";

export interface GastoState {
  ok?: boolean;
  error?: string;
}

const PERIODICIDADES = ["UNICA", "QUINCENAL", "MENSUAL", "BIMESTRAL", "SEMESTRAL", "ANUAL"];

export async function crearGasto(_prev: GastoState, formData: FormData): Promise<GastoState> {
  const tiendaId = String(formData.get("tiendaId") ?? "") || null;
  await requireCan("FINANZAS", "write", tiendaId ?? undefined);

  const categoriaGastoId = String(formData.get("categoriaGastoId") ?? "");
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const monto = String(formData.get("monto") ?? "");
  const fechaStr = String(formData.get("fecha") ?? "");
  const periodicidad = (PERIODICIDADES.includes(String(formData.get("periodicidad")))
    ? String(formData.get("periodicidad"))
    : "UNICA") as Periodicidad;

  if (!categoriaGastoId || !descripcion) return { error: "Categoría y descripción son obligatorias." };
  if (Number.isNaN(Number(monto)) || Number(monto) <= 0) return { error: "Monto inválido." };

  const cat = await prisma.categoriaGasto.findUnique({ where: { id: categoriaGastoId } });
  if (!cat) return { error: "Categoría no encontrada." };

  // Auto-cálculo de IVA/ISR desde la categoría (informativos).
  const m = new Decimal(monto);
  const iva = m.mul(cat.ivaPct).div(100).toDecimalPlaces(2);
  const isr = m.mul(cat.isrPct).div(100).toDecimalPlaces(2);
  const fecha = fechaStr ? new Date(`${fechaStr}T12:00:00`) : new Date();

  await prisma.gasto.create({
    data: { fecha, categoriaGastoId, descripcion, monto, iva, isr, tiendaId, periodicidad },
  });
  revalidatePath("/finanzas/gastos");
  revalidatePath("/finanzas/estado-resultados");
  return { ok: true };
}
