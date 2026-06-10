// Módulo `tax` (puro): desglose de IVA con reconciliación de centavos.
//
// El cliente captura el TOTAL con IVA. Para el CFDI necesitamos subtotal + IVA
// tales que `subtotal + iva === total` EXACTO a 2 decimales (si no, el PAC
// rechaza por descuadre de centavos). Se opera en centavos (enteros) para no
// arrastrar error de punto flotante.

export interface DesgloseIva {
  /** Base gravable (importe del concepto). */
  subtotal: number;
  /** Importe del traslado de IVA. */
  iva: number;
  /** Total con IVA (== subtotal + iva). */
  total: number;
  /** Tasa aplicada (p.ej. 0.16). */
  tasa: number;
}

/**
 * Desglosa un total con IVA en { subtotal, iva } a 2 decimales, garantizando
 * `subtotal + iva === total`. El IVA se obtiene por diferencia para cerrar el
 * cuadre exacto (el residuo de redondeo, ≤ 1 centavo, cae en el IVA, dentro de
 * la tolerancia del SAT para el traslado).
 */
export function desglosarIva(total: number, tasa = 0.16): DesgloseIva {
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error(`Total inválido para desglose de IVA: ${total}`);
  }
  if (!Number.isFinite(tasa) || tasa < 0) {
    throw new Error(`Tasa de IVA inválida: ${tasa}`);
  }

  const totalCent = Math.round(total * 100);
  const subtotalCent = Math.round(totalCent / (1 + tasa));
  const ivaCent = totalCent - subtotalCent;

  return {
    subtotal: subtotalCent / 100,
    iva: ivaCent / 100,
    total: totalCent / 100,
    tasa,
  };
}
