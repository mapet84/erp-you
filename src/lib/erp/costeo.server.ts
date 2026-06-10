// Construye árboles de componentes de recetas desde la BD, resolviendo
// semi-terminados anidados, con dos bases de costo de hoja:
//   - compra: costo de compra general del ingrediente → precio.
//   - CPM por tienda: costo real (promedio móvil) → COGS/utilidad.
// La detección de ciclos vive aquí (al construir) y en el módulo puro `costeo`.

import { prisma } from "@/lib/db";
import { Decimal } from "./money";
import { costoRecetaArbol, type Componente, type Insumo } from "./costeo";

type CompRow = {
  ingredienteId: string | null;
  semiTerminadoId?: string | null;
  hijoId?: string | null;
  cantidad: Decimal;
  rendimiento: Decimal;
};

/// Crea un conversor de fila → Componente, dada una fuente de costo de hoja por
/// ingrediente y el mapa de partes de cada semi-terminado.
function builder(
  costoIngrediente: (ingredienteId: string) => Decimal,
  partesSemi: Map<string, CompRow[]>,
) {
  const hoja = (id: string): Insumo => ({ kind: "ingrediente", id, costoUnitario: costoIngrediente(id) });
  const nodo = (id: string, vistos: Set<string>): Insumo => {
    if (vistos.has(id)) throw new Error(`Ciclo de semi-terminados en "${id}".`);
    const v = new Set(vistos).add(id);
    return {
      kind: "semi",
      id,
      componentes: (partesSemi.get(id) ?? []).map((c) => ({
        insumo: c.ingredienteId ? hoja(c.ingredienteId) : nodo(c.hijoId!, v),
        cantidad: c.cantidad,
        rendimiento: c.rendimiento,
      })),
    };
  };
  return (c: CompRow): Componente => ({
    insumo: c.ingredienteId ? hoja(c.ingredienteId) : nodo(c.semiTerminadoId!, new Set()),
    cantidad: c.cantidad,
    rendimiento: c.rendimiento,
  });
}

async function partesSemiMap(): Promise<Map<string, CompRow[]>> {
  const semis = await prisma.semiTerminado.findMany({ include: { componentes: true } });
  return new Map(semis.map((s) => [s.id, s.componentes]));
}

/// Componentes (árbol, costo de compra) de una receta.
export async function componentesCompraDeReceta(recetaId: string): Promise<Componente[]> {
  const [receta, ingredientes, partes] = await Promise.all([
    prisma.receta.findUnique({ where: { id: recetaId }, include: { componentes: true } }),
    prisma.ingrediente.findMany({ select: { id: true, costoCompra: true } }),
    partesSemiMap(),
  ]);
  if (!receta) return [];
  const costoIng = new Map(ingredientes.map((i) => [i.id, i.costoCompra]));
  const aComponente = builder((id) => costoIng.get(id) ?? new Decimal(0), partes);
  return receta.componentes.map(aComponente);
}

/// Costo de compra total por receta (todas), en una sola pasada. recetaId → costo.
export async function costosCompraPorReceta(): Promise<Map<string, Decimal>> {
  const [recetas, ingredientes, partes] = await Promise.all([
    prisma.receta.findMany({ include: { componentes: true } }),
    prisma.ingrediente.findMany({ select: { id: true, costoCompra: true } }),
    partesSemiMap(),
  ]);
  const costoIng = new Map(ingredientes.map((i) => [i.id, i.costoCompra]));
  const aComponente = builder((id) => costoIng.get(id) ?? new Decimal(0), partes);
  const out = new Map<string, Decimal>();
  for (const r of recetas) out.set(r.id, costoRecetaArbol(r.componentes.map(aComponente)));
  return out;
}

/// Costo CPM real por receta para una tienda (usa el CPM del ingrediente en esa
/// tienda; 0 si no hay existencia registrada). recetaId → costo CPM.
export async function costosCPMPorReceta(tiendaId: string): Promise<Map<string, Decimal>> {
  const [recetas, ingredientes, inventario, partes] = await Promise.all([
    prisma.receta.findMany({ include: { componentes: true } }),
    prisma.ingrediente.findMany({ select: { id: true, codigo: true } }),
    prisma.inventario.findMany({ where: { tiendaId }, select: { codigo: true, cpm: true } }),
    partesSemiMap(),
  ]);
  const cpmPorCodigo = new Map(inventario.map((i) => [i.codigo, i.cpm]));
  const cpmPorIngrediente = new Map(
    ingredientes.map((i) => [i.id, cpmPorCodigo.get(i.codigo) ?? new Decimal(0)]),
  );
  const aComponente = builder((id) => cpmPorIngrediente.get(id) ?? new Decimal(0), partes);
  const out = new Map<string, Decimal>();
  for (const r of recetas) out.set(r.id, costoRecetaArbol(r.componentes.map(aComponente)));
  return out;
}
