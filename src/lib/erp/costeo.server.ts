// Construye el árbol de componentes de una receta desde la BD, resolviendo
// semi-terminados anidados. Reutilizado por el detalle de receta y la explosión
// de compras (#11). La detección de ciclos vive aquí (al construir) y en el
// módulo puro `costeo` (al costear/explotar).

import { prisma } from "@/lib/db";
import { Decimal } from "./money";
import type { Componente, Insumo } from "./costeo";

/// Componentes de una receta con el costo de compra general como hoja.
export async function componentesCompraDeReceta(recetaId: string): Promise<Componente[]> {
  const [receta, ingredientes, semis] = await Promise.all([
    prisma.receta.findUnique({ where: { id: recetaId }, include: { componentes: true } }),
    prisma.ingrediente.findMany({ select: { id: true, costoCompra: true } }),
    prisma.semiTerminado.findMany({ include: { componentes: true } }),
  ]);
  if (!receta) return [];

  const costoIng = new Map(ingredientes.map((i) => [i.id, i.costoCompra]));
  const partesSemi = new Map(semis.map((s) => [s.id, s.componentes]));

  const hojaIngrediente = (id: string): Insumo => ({
    kind: "ingrediente",
    id,
    costoUnitario: costoIng.get(id) ?? new Decimal(0),
  });
  const nodoSemi = (id: string, vistos: Set<string>): Insumo => {
    if (vistos.has(id)) throw new Error(`Ciclo de semi-terminados en "${id}".`);
    const v = new Set(vistos).add(id);
    return {
      kind: "semi",
      id,
      componentes: (partesSemi.get(id) ?? []).map((c) => ({
        insumo: c.ingredienteId ? hojaIngrediente(c.ingredienteId) : nodoSemi(c.hijoId!, v),
        cantidad: c.cantidad,
        rendimiento: c.rendimiento,
      })),
    };
  };

  return receta.componentes.map((c) => ({
    insumo: c.ingredienteId
      ? hojaIngrediente(c.ingredienteId)
      : nodoSemi(c.semiTerminadoId!, new Set()),
    cantidad: c.cantidad,
    rendimiento: c.rendimiento,
  }));
}
