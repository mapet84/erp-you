// Matemática de una línea de venta del POS (módulo puro). Reusa el desglose de
// IVA de Fase 1 (`tax.desglosarIva`). La cantidad firma el movimiento: positiva
// para venta, negativa para devolución.

import { Decimal, toDecimal, type DecimalLike } from "./money";
import { desglosarIva } from "@/lib/tax";

export interface LineaVentaInput {
  /// Precio unitario CON IVA (del canal).
  precioUnit: DecimalLike;
  /// Cantidad (positiva = venta, negativa = devolución).
  qty: DecimalLike;
  /// Comisión del canal/medio en % humano (3 = 3%).
  comisionPct?: DecimalLike;
  /// Costo unitario (COGS): CPM de la receta/producto en la tienda.
  costoUnitario: DecimalLike;
  /// Tasa de IVA (default 0.16).
  tasa?: DecimalLike;
}

export interface LineaVenta {
  totalVenta: Decimal;
  subtotalSinIva: Decimal;
  iva: Decimal;
  comisionMonto: Decimal;
  costo: Decimal;
  utilidadMonto: Decimal;
  utilidadPct: Decimal;
}

/// Calcula una línea de venta a 2 decimales. Maneja qty negativa (devolución):
/// todos los montos quedan negativos de forma consistente.
export function calcularLineaVenta(input: LineaVentaInput): LineaVenta {
  const precio = toDecimal(input.precioUnit);
  const qty = toDecimal(input.qty);
  const comisionPct = toDecimal(input.comisionPct ?? 0);
  const costoUnit = toDecimal(input.costoUnitario);
  const tasa = toDecimal(input.tasa ?? 0.16);

  const totalVenta = precio.mul(qty).toDecimalPlaces(2);
  if (totalVenta.isZero()) {
    const z = new Decimal(0);
    return { totalVenta: z, subtotalSinIva: z, iva: z, comisionMonto: z, costo: z, utilidadMonto: z, utilidadPct: z };
  }
  // Desglose de IVA sobre el valor absoluto, preservando el signo de la venta.
  const signo = totalVenta.isNegative() ? -1 : 1;
  const { subtotal, iva } = desglosarIva(totalVenta.abs().toNumber(), tasa.toNumber());
  const subtotalSinIva = new Decimal(subtotal).mul(signo);
  const ivaDec = new Decimal(iva).mul(signo);

  const comisionMonto = subtotalSinIva.mul(comisionPct).div(100).toDecimalPlaces(2);
  const costo = costoUnit.mul(qty).toDecimalPlaces(2);
  const utilidadMonto = subtotalSinIva.minus(comisionMonto).minus(costo).toDecimalPlaces(2);
  const utilidadPct = subtotalSinIva.isZero()
    ? new Decimal(0)
    : utilidadMonto.div(subtotalSinIva).mul(100).toDecimalPlaces(2);

  return { totalVenta, subtotalSinIva, iva: ivaDec, comisionMonto, costo, utilidadMonto, utilidadPct };
}

/// Agrega varias líneas en los totales del ticket.
export function agregarTicket(lineas: LineaVenta[]) {
  const z = () => new Decimal(0);
  return lineas.reduce(
    (acc, l) => ({
      totalVenta: acc.totalVenta.plus(l.totalVenta),
      subtotalSinIva: acc.subtotalSinIva.plus(l.subtotalSinIva),
      iva: acc.iva.plus(l.iva),
      comisionMonto: acc.comisionMonto.plus(l.comisionMonto),
      costo: acc.costo.plus(l.costo),
      utilidadMonto: acc.utilidadMonto.plus(l.utilidadMonto),
    }),
    { totalVenta: z(), subtotalSinIva: z(), iva: z(), comisionMonto: z(), costo: z(), utilidadMonto: z() },
  );
}
