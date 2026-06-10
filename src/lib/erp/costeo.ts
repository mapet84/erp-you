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
