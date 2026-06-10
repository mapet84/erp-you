// Construye árboles de componentes de recetas desde la BD, resolviendo
// semi-terminados anidados. Reutilizado por el detalle de receta, la
// repreciación/reporte (#5) y la explosión de compras (#11). La detección de
// ciclos vive aquí (al construir) y en el módulo puro `costeo`.

import { prisma } from "@/lib/db";
import { Decimal } from "./money";
import { costoRecetaArbol, type Componente, type Insumo } from "./costeo";

/// Carga los mapas necesarios para construir árboles (costo de compra como hoja).
async function cargarMapasCompra() {
  const [ingredientes, semis] = await Promise.all([
    prisma.ingrediente.findMany({ select: { id: true, costoCompra: true } }),
    prisma.semiTerminado.findMany({ include: { componentes: true } }),
  ]);
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
  const aComponente = (c: {
    ingredienteId: string | null;
    semiTerminadoId: string | null;
    cantidad: Decimal;
    rendimiento: Decimal;
  }): Componente => ({
    insumo: c.ingredienteId ? hojaIngrediente(c.ingredienteId) : nodoSemi(c.semiTerminadoId!, new Set()),
    cantidad: c.cantidad,
    rendimiento: c.rendimiento,
  });

  return { aComponente };
}

/// Componentes (árbol, costo de compra) de una receta.
export async function componentesCompraDeReceta(recetaId: string): Promise<Componente[]> {
  const receta = await prisma.receta.findUnique({ where: { id: recetaId }, include: { componentes: true } });
  if (!receta) return [];
  const { aComponente } = await cargarMapasCompra();
  return receta.componentes.map(aComponente);
}

/// Costo de compra total por receta (todas), en una sola pasada. recetaId → costo.
export async function costosCompraPorReceta(): Promise<Map<string, Decimal>> {
  const [recetas, { aComponente }] = await Promise.all([
    prisma.receta.findMany({ include: { componentes: true } }),
    cargarMapasCompra(),
  ]);
  const out = new Map<string, Decimal>();
  for (const r of recetas) {
    out.set(r.id, costoRecetaArbol(r.componentes.map(aComponente)));
  }
  return out;
}
