// Costeo de recetas (módulo puro, sin BD). El costo se calcula en vivo desde los
// componentes. La base de costo unitario puede ser el costo de compra general
// (para precio) o el CPM por tienda (para COGS) — el llamador decide cuál pasa.
//
// Semi-terminados (explosión recursiva) y detección de ciclos: rebanada #4.

import { Decimal, toDecimal, type DecimalLike } from "./money";

export interface ComponenteCosteo {
  /// Costo unitario del insumo (costoCompra general o CPM, según el caso).
  costoUnitario: DecimalLike;
  /// Cantidad del insumo en la receta (unidad base del insumo).
  cantidad: DecimalLike;
  /// Rendimiento en % (100 = sin ajuste). Ajusta por merma del proceso.
  rendimiento?: DecimalLike;
}

/// Costo de un componente: costoUnitario × cantidad ÷ (rendimiento/100).
/// Un rendimiento de 50% duplica el costo (se aprovecha la mitad).
export function costoComponente(c: ComponenteCosteo): Decimal {
  const costo = toDecimal(c.costoUnitario);
  const cantidad = toDecimal(c.cantidad);
  const rendimiento = toDecimal(c.rendimiento ?? 100);
  if (rendimiento.lte(0)) {
    throw new Error("El rendimiento debe ser mayor que 0.");
  }
  const factor = rendimiento.div(100);
  return costo.mul(cantidad).div(factor);
}

/// Costo total de una receta = suma del costo de sus componentes.
export function costoReceta(componentes: ComponenteCosteo[]): Decimal {
  return componentes.reduce(
    (total, c) => total.plus(costoComponente(c)),
    new Decimal(0),
  );
}

// ── Árbol de insumos: recetas con ingredientes y/o semi-terminados anidados ──

/// Un insumo es una hoja (ingrediente, con su costo unitario e id) o un nodo
/// (semi-terminado, con id y sus propios componentes — posiblemente anidados).
export type Insumo =
  | { kind: "ingrediente"; id: string; costoUnitario: DecimalLike }
  | { kind: "semi"; id: string; componentes: Componente[] };

export interface Componente {
  insumo: Insumo;
  cantidad: DecimalLike;
  rendimiento?: DecimalLike;
}

/// Factor de un componente: cantidad ÷ (rendimiento/100).
function factor(c: Componente): Decimal {
  const rendimiento = toDecimal(c.rendimiento ?? 100);
  if (rendimiento.lte(0)) throw new Error("El rendimiento debe ser mayor que 0.");
  return toDecimal(c.cantidad).div(rendimiento.div(100));
}

/// Costo unitario de un insumo. Para un semi-terminado lo calcula recursivamente
/// sumando sus componentes. Detecta ciclos (un semi que se contiene a sí mismo).
export function costoUnitarioInsumo(insumo: Insumo, visitados: Set<string> = new Set()): Decimal {
  if (insumo.kind === "ingrediente") return toDecimal(insumo.costoUnitario);
  if (visitados.has(insumo.id)) {
    throw new Error(`Ciclo de semi-terminados detectado en "${insumo.id}".`);
  }
  const v = new Set(visitados).add(insumo.id);
  return insumo.componentes.reduce(
    (total, c) => total.plus(costoUnitarioInsumo(c.insumo, v).mul(factor(c))),
    new Decimal(0),
  );
}

/// Costo total de una receta-árbol (ingredientes y/o semi-terminados anidados).
export function costoRecetaArbol(componentes: Componente[]): Decimal {
  return componentes.reduce(
    (total, c) => total.plus(costoUnitarioInsumo(c.insumo).mul(factor(c))),
    new Decimal(0),
  );
}

/// Explosión a ingredientes hoja: cantidad total de cada ingrediente (por id)
/// necesaria para los componentes dados. Base de la explosión de compras (#11).
export function explotar(
  componentes: Componente[],
  visitados: Set<string> = new Set(),
): Map<string, Decimal> {
  const acc = new Map<string, Decimal>();
  const sumar = (id: string, qty: Decimal) =>
    acc.set(id, (acc.get(id) ?? new Decimal(0)).plus(qty));

  for (const c of componentes) {
    const f = factor(c);
    if (c.insumo.kind === "ingrediente") {
      sumar(c.insumo.id, f);
    } else {
      if (visitados.has(c.insumo.id)) {
        throw new Error(`Ciclo de semi-terminados detectado en "${c.insumo.id}".`);
      }
      const v = new Set(visitados).add(c.insumo.id);
      for (const [id, qty] of explotar(c.insumo.componentes, v)) {
        sumar(id, qty.mul(f));
      }
    }
  }
  return acc;
}
