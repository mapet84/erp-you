"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { materializarVentasSemanales } from "@/lib/erp/ventas-semanales.server";
import { generarPronostico } from "@/lib/erp/forecast.server";
import type { MetodoPonderacion } from "@/lib/erp/forecast";

function entero(v: FormDataEntryValue | null, def: number, min: number, max: number): number {
  const n = Math.trunc(Number(v));
  if (Number.isNaN(n)) return def;
  return Math.min(Math.max(n, min), max);
}

export async function correrPronostico(formData: FormData): Promise<void> {
  const tiendaId = String(formData.get("tiendaId") ?? "");
  await requireCan("PRONOSTICOS", "write", tiendaId || undefined);
  if (!tiendaId) return;

  const metodoRaw = String(formData.get("metodo") ?? "lineal");
  const metodo = (["lineal", "exponencial", "plano"].includes(metodoRaw) ? metodoRaw : "lineal") as MetodoPonderacion;
  const semanasHistoria = entero(formData.get("semanasHistoria"), 12, 1, 104);
  const horizonteSemanas = entero(formData.get("horizonte"), 4, 1, 52);
  const usaTendencia = formData.get("usaTendencia") === "on";
  const crecimientoNum = Number(formData.get("crecimiento"));
  const crecimiento = Number.isNaN(crecimientoNum) || crecimientoNum <= 0 ? 1 : crecimientoNum;

  await materializarVentasSemanales();
  const id = await generarPronostico(tiendaId, {
    metodo,
    semanasHistoria,
    horizonteSemanas,
    usaTendencia,
    usaEstacional: false,
    crecimiento,
  });
  redirect(`/pronosticos/${id}`);
}

export async function confirmarPronostico(formData: FormData): Promise<void> {
  await requireCan("PRONOSTICOS", "write");
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.pronostico.update({ where: { id }, data: { estado: "CONFIRMADO" } });
  revalidatePath(`/pronosticos/${id}`);
}
