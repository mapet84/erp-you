"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { siguienteSkuReceta } from "@/lib/erp/codigos.server";

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

  const nombre = String(formData.get("nombre") ?? "").trim();
  const categoriaId = String(formData.get("categoriaId") ?? "");
  const tamanoId = String(formData.get("tamanoId") ?? "") || null;
  if (!nombre || !categoriaId) return { error: "Nombre y categoría son obligatorios." };

  const tipos = formData.getAll("comp_tipo").map(String); // "ing" | "semi"
  const refIds = formData.getAll("comp_refId").map(String);
  const cantidades = formData.getAll("comp_cantidad").map(String);
  const rendimientos = formData.getAll("comp_rendimiento").map(String);

  const componentes: {
    ingredienteId?: string;
    semiTerminadoId?: string;
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
    if (Number.isNaN(Number(rendimiento)) || Number(rendimiento) <= 0) {
      return { error: "El rendimiento debe ser mayor que 0." };
    }
    componentes.push(
      tipos[k] === "semi"
        ? { semiTerminadoId: refIds[k], cantidad, rendimiento }
        : { ingredienteId: refIds[k], cantidad, rendimiento },
    );
  }
  if (componentes.length === 0) return { error: "Agrega al menos un componente." };

  try {
    const sku = await siguienteSkuReceta(categoriaId, tamanoId);
    const receta = await prisma.receta.create({
      data: { sku, nombre, categoriaId, tamanoId, componentes: { create: componentes } },
    });
    revalidatePath("/gestion/recetas");
    return { ok: true, recetaId: receta.id };
  } catch {
    return { error: "No se pudo crear la receta." };
  }
}
