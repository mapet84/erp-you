"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";

export interface RecetaState {
  ok?: boolean;
  error?: string;
  recetaId?: string;
}

export async function crearReceta(
  _prev: RecetaState,
  formData: FormData,
): Promise<RecetaState> {
  await requireCan("GESTION", "configure");

  const sku = String(formData.get("sku") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const categoriaId = String(formData.get("categoriaId") ?? "");
  if (!sku || !nombre || !categoriaId) return { error: "SKU, nombre y categoría son obligatorios." };

  const ingredienteIds = formData.getAll("comp_ingredienteId").map(String);
  const cantidades = formData.getAll("comp_cantidad").map(String);
  const rendimientos = formData.getAll("comp_rendimiento").map(String);

  const componentes: { ingredienteId: string; cantidad: string; rendimiento: string }[] = [];
  for (let k = 0; k < ingredienteIds.length; k++) {
    if (!ingredienteIds[k]) continue;
    const cantidad = cantidades[k];
    const rendimiento = rendimientos[k] || "100";
    if (Number.isNaN(Number(cantidad)) || Number(cantidad) <= 0) {
      return { error: "Cada componente necesita una cantidad mayor que 0." };
    }
    if (Number.isNaN(Number(rendimiento)) || Number(rendimiento) <= 0) {
      return { error: "El rendimiento debe ser mayor que 0." };
    }
    componentes.push({ ingredienteId: ingredienteIds[k], cantidad, rendimiento });
  }
  if (componentes.length === 0) return { error: "Agrega al menos un componente." };

  try {
    const receta = await prisma.receta.create({
      data: {
        sku: sku.toUpperCase(),
        nombre,
        categoriaId,
        componentes: { create: componentes },
      },
    });
    revalidatePath("/gestion/recetas");
    return { ok: true, recetaId: receta.id };
  } catch {
    return { error: "Ya existe una receta con ese SKU." };
  }
}
