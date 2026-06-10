// Precios y márgenes (módulo puro). El precio de venta se deriva del costo de
// compra y un margen objetivo por (categoría, canal). IVA por defecto 16%.

import { Decimal, toDecimal, type DecimalLike } from "./money";

const IVA_DEFAULT = 0.16;

/// Precio sin IVA a partir del precio con IVA: pv / (1 + tasa).
export function pvSinIva(pv: DecimalLike, tasa: DecimalLike = IVA_DEFAULT): Decimal {
  return toDecimal(pv).div(toDecimal(tasa).plus(1));
}

/// Margen como fracción sobre el precio sin IVA: (pvSin − costo) / pvSin.
/// Devuelve 0 si pvSin ≤ 0 (evita división por cero).
export function margen(pvSinIva: DecimalLike, costo: DecimalLike): Decimal {
  const pv = toDecimal(pvSinIva);
  if (pv.lte(0)) return new Decimal(0);
  return pv.minus(toDecimal(costo)).div(pv);
}

/// Precio de venta CON IVA sugerido para alcanzar un margen objetivo (%):
///   precioSinIva = costo / (1 − margen/100);  precio = precioSinIva × (1 + tasa).
/// Redondea a 2 decimales. Lanza si el margen ≥ 100% (precio infinito).
export function precioDesdeMargen(
  costo: DecimalLike,
  margenObjetivoPct: DecimalLike,
  tasa: DecimalLike = IVA_DEFAULT,
): Decimal {
  const m = toDecimal(margenObjetivoPct).div(100);
  if (m.gte(1)) {
    throw new Error("El margen objetivo debe ser menor a 100%.");
  }
  const precioSinIva = toDecimal(costo).div(new Decimal(1).minus(m));
  return precioSinIva.mul(toDecimal(tasa).plus(1)).toDecimalPlaces(2);
}
