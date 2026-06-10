"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";

export interface SemiState {
  ok?: boolean;
  error?: string;
}

export async function crearSemiTerminado(
  _prev: SemiState,
  formData: FormData,
): Promise<SemiState> {
  await requireCan("GESTION", "configure");

  const sku = String(formData.get("sku") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!sku || !nombre) return { error: "SKU y nombre son obligatorios." };

  const tipos = formData.getAll("comp_tipo").map(String); // "ing" | "semi"
  const refIds = formData.getAll("comp_refId").map(String);
  const cantidades = formData.getAll("comp_cantidad").map(String);
  const rendimientos = formData.getAll("comp_rendimiento").map(String);

  const componentes: {
    ingredienteId?: string;
    hijoId?: string;
    cantidad: string;
    rendimiento: string;
  }[] = [];
  for (let k = 0; k < refIds.length; k++) {
    if (!refIds[k]) continue;
    const cantidad = cantidades[k];
    const rendimiento = rendimientos[k] || "100";
    if (Number.isNaN(Number(cantidad)) || Number(cantidad) <= 0) {
      return { error: "Cada componente necesita una cantidad mayor que 0." };
    }
    componentes.push(
      tipos[k] === "semi"
        ? { hijoId: refIds[k], cantidad, rendimiento }
        : { ingredienteId: refIds[k], cantidad, rendimiento },
    );
  }
  if (componentes.length === 0) return { error: "Agrega al menos un componente." };

  try {
    await prisma.semiTerminado.create({
      data: { sku: sku.toUpperCase(), nombre, componentes: { create: componentes } },
    });
  } catch {
    return { error: "Ya existe un semi-terminado con ese SKU." };
  }
  revalidatePath("/gestion/semiterminados");
  return { ok: true };
}
