"use server";

import { revalidatePath } from "next/cache";
import { requireCan } from "@/lib/erp/session.server";
import {
  importarIngredientes,
  importarProductos,
  importarSemiTerminados,
  importarRecetas,
  type ResultadoImport,
} from "@/lib/erp/import-csv.server";

export interface ImportState {
  ok?: boolean;
  resumen?: ResultadoImport;
  error?: string;
}

async function leerCsv(formData: FormData): Promise<string | null> {
  const archivo = formData.get("archivo");
  if (archivo && typeof archivo === "object" && "text" in archivo && (archivo as File).size > 0) {
    return await (archivo as File).text();
  }
  const texto = String(formData.get("texto") ?? "").trim();
  return texto || null;
}

async function ejecutar(
  formData: FormData,
  fn: (texto: string) => Promise<ResultadoImport>,
  revalidar: string[],
): Promise<ImportState> {
  await requireCan("GESTION", "configure");
  const texto = await leerCsv(formData);
  if (!texto) return { error: "Sube un archivo CSV o pega el contenido." };
  try {
    const resumen = await fn(texto);
    for (const p of revalidar) revalidatePath(p);
    return { ok: true, resumen };
  } catch (e) {
    return { error: "No se pudo procesar el CSV: " + (e as Error).message };
  }
}

export async function importIngredientesAction(_p: ImportState, fd: FormData): Promise<ImportState> {
  return ejecutar(fd, importarIngredientes, ["/gestion/ingredientes"]);
}
export async function importProductosAction(_p: ImportState, fd: FormData): Promise<ImportState> {
  return ejecutar(fd, importarProductos, ["/gestion/productos"]);
}
export async function importSemisAction(_p: ImportState, fd: FormData): Promise<ImportState> {
  return ejecutar(fd, importarSemiTerminados, ["/gestion/semiterminados"]);
}
export async function importRecetasAction(_p: ImportState, fd: FormData): Promise<ImportState> {
  return ejecutar(fd, importarRecetas, ["/gestion/recetas"]);
}
