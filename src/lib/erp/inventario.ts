// Inventario con costo promedio móvil (CPM/MAP) — módulo puro, sin BD.
// Una entrada (compra) recalcula el CPM; una salida (venta/merma) sale al CPM
// vigente. El estado por (tienda, código) lo persiste `inventario.server`.

import { Decimal, toDecimal, type DecimalLike } from "./money";

export interface EstadoInventario {
  stock: DecimalLike;
  cpm: DecimalLike;
}

export interface ResultadoMovimiento {
  /// Stock resultante.
  stock: Decimal;
  /// CPM resultante.
  cpm: Decimal;
  /// Valor total del inventario resultante (stock × cpm).
  valorTotal: Decimal;
  /// Cantidad firmada del movimiento (+ entrada, − salida).
  qty: Decimal;
  /// Costo firmado del movimiento, al CPM aplicable (+ entrada, − salida).
  costoMovimiento: Decimal;
}

/// Entrada por compra: recalcula el CPM por promedio móvil:
///   nuevoCPM = (stockPrev·cpmPrev + qtyIn·costoCompra) / (stockPrev + qtyIn).
/// Si el stock previo es ≤ 0 (sin base contra la cual promediar), el CPM toma
/// el costo de compra de esta entrada.
export function recostearEntrada(
  prev: EstadoInventario,
  qtyIn: DecimalLike,
  costoUnitario: DecimalLike,
): ResultadoMovimiento {
  const stockPrev = toDecimal(prev.stock);
  const cpmPrev = toDecimal(prev.cpm);
  const qty = toDecimal(qtyIn);
  const costo = toDecimal(costoUnitario);
  if (qty.lte(0)) throw new Error("La cantidad de entrada debe ser mayor que 0.");

  const stock = stockPrev.plus(qty);
  const cpm = stockPrev.lte(0)
    ? costo
    : stockPrev.mul(cpmPrev).plus(qty.mul(costo)).div(stock);
  return {
    stock,
    cpm,
    valorTotal: stock.mul(cpm).toDecimalPlaces(2),
    qty,
    costoMovimiento: qty.mul(costo).toDecimalPlaces(2),
  };
}

/// Salida (venta/merma): el stock baja y la salida se valúa al CPM vigente
/// (que no cambia). Permite stock negativo (se reporta como alerta aparte).
export function aplicarSalida(
  prev: EstadoInventario,
  qtyOut: DecimalLike,
): ResultadoMovimiento {
  const stockPrev = toDecimal(prev.stock);
  const cpm = toDecimal(prev.cpm);
  const qty = toDecimal(qtyOut);
  if (qty.lte(0)) throw new Error("La cantidad de salida debe ser mayor que 0.");

  const stock = stockPrev.minus(qty);
  return {
    stock,
    cpm,
    valorTotal: stock.mul(cpm).toDecimalPlaces(2),
    qty: qty.negated(),
    costoMovimiento: qty.mul(cpm).negated().toDecimalPlaces(2),
  };
}

/// Devolución (reingreso): inverso de una salida, al CPM vigente.
export function aplicarDevolucion(
  prev: EstadoInventario,
  qty: DecimalLike,
): ResultadoMovimiento {
  const stockPrev = toDecimal(prev.stock);
  const cpm = toDecimal(prev.cpm);
  const q = toDecimal(qty);
  if (q.lte(0)) throw new Error("La cantidad debe ser mayor que 0.");
  const stock = stockPrev.plus(q);
  return {
    stock,
    cpm,
    valorTotal: stock.mul(cpm).toDecimalPlaces(2),
    qty: q,
    costoMovimiento: q.mul(cpm).toDecimalPlaces(2),
  };
}
