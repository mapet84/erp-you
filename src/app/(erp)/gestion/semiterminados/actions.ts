"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCan, requireAdmin } from "@/lib/erp/session.server";
import { siguienteSkuSemiTerminado } from "@/lib/erp/codigos.server";

/// Elimina un semi-terminado (solo admin). Cascada de componentes; FK-safe si está en recetas.
export async function borrarSemiTerminado(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) { try { await prisma.semiTerminado.delete({ where: { id } }); } catch { /* en uso */ } }
  revalidatePath("/gestion/semiterminados");
}

export interface SemiState {
  ok?: boolean;
  error?: string;
}

export async function crearSemiTerminado(
  _prev: SemiState,
  formData: FormData,
): Promise<SemiState> {
  await requireCan("GESTION", "configure");

  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

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
    const sku = await siguienteSkuSemiTerminado();
    await prisma.semiTerminado.create({
      data: { sku, nombre, componentes: { create: componentes } },
    });
  } catch {
    return { error: "No se pudo crear el semi-terminado." };
  }
  revalidatePath("/gestion/semiterminados");
  return { ok: true };
}
