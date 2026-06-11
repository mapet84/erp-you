// Asignación de códigos contra la BD. Ingredientes: consecutivo 100001–199999.
// Recetas/productos/semi-terminados: ver codigos.ts (abreviaturas + consecutivo).

import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { abreviar, siguienteNumero, prefijoReceta } from "./codigos";

const ING_MIN = 100001;
const ING_MAX = 199999;

type Cliente = typeof prisma | Prisma.TransactionClient;

/// Siguiente código de ingrediente (consecutivo en [100001, 199999]).
export async function siguienteCodigoIngrediente(client: Cliente = prisma): Promise<string> {
  const ings = await client.ingrediente.findMany({ select: { codigo: true } });
  let max = ING_MIN - 1;
  for (const i of ings) {
    const n = Number(i.codigo);
    if (Number.isInteger(n) && n >= ING_MIN && n <= ING_MAX && n > max) max = n;
  }
  const next = max + 1;
  if (next > ING_MAX) throw new Error("Se agotó el rango de códigos de ingrediente (199999).");
  return String(next);
}

/// Abreviatura efectiva de una categoría/tamaño (la guardada o derivada del nombre).
function abrevDe(o: { abreviatura: string | null; nombre: string }): string {
  return (o.abreviatura?.trim() ? o.abreviatura.trim().toUpperCase() : abreviar(o.nombre));
}

/// SKU de receta = abrevCategoría + abrevTamaño + consecutivo (por prefijo).
/// `extra` son SKUs ya asignados en el mismo lote (para importación masiva).
export async function siguienteSkuReceta(
  categoriaId: string,
  tamanoId: string | null,
  client: Cliente = prisma,
  extra: string[] = [],
): Promise<string> {
  const cat = await client.categoria.findUniqueOrThrow({ where: { id: categoriaId }, select: { abreviatura: true, nombre: true } });
  let abrevTam = "";
  if (tamanoId) {
    const t = await client.tamano.findUnique({ where: { id: tamanoId }, select: { abreviatura: true, nombre: true } });
    if (t) abrevTam = abrevDe(t);
  }
  const prefijo = prefijoReceta(abrevDe(cat), abrevTam);
  const skus = (await client.receta.findMany({ select: { sku: true } })).map((r) => r.sku);
  return `${prefijo}${siguienteNumero([...skus, ...extra], prefijo)}`;
}

/// Código de producto = abrevCategoría + consecutivo (por prefijo).
export async function siguienteCodigoProducto(
  categoriaId: string,
  client: Cliente = prisma,
  extra: string[] = [],
): Promise<string> {
  const cat = await client.categoria.findUniqueOrThrow({ where: { id: categoriaId }, select: { abreviatura: true, nombre: true } });
  const prefijo = abrevDe(cat);
  const codigos = (await client.producto.findMany({ select: { codigo: true } })).map((p) => p.codigo);
  return `${prefijo}${siguienteNumero([...codigos, ...extra], prefijo)}`;
}

/// SKU de semi-terminado = "ST" + consecutivo.
export async function siguienteSkuSemiTerminado(
  client: Cliente = prisma,
  extra: string[] = [],
): Promise<string> {
  const skus = (await client.semiTerminado.findMany({ select: { sku: true } })).map((s) => s.sku);
  return `ST${siguienteNumero([...skus, ...extra], "ST")}`;
}
