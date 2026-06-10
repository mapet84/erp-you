// Pronóstico de ventas (módulo puro). La parte estadística trabaja con números
// (es una estimación); el costeo/BOM usa Decimal vía `costeo.explotar`. Sin
// historia suficiente, degrada con gracia a promedio simple.

import { Decimal, toDecimal, type DecimalLike } from "./money";

export type MetodoPonderacion = "lineal" | "exponencial" | "plano";

/// Pesos por periodo (serie de antiguo→reciente). Suman 1; el más reciente pesa
/// más (salvo "plano"). n ≤ 0 devuelve [].
export function pesos(n: number, metodo: MetodoPonderacion): number[] {
  if (n <= 0) return [];
  const crudos =
    metodo === "plano"
      ? Array.from({ length: n }, () => 1)
      : metodo === "exponencial"
        ? Array.from({ length: n }, (_, i) => Math.pow(1.5, i))
        : Array.from({ length: n }, (_, i) => i + 1); // lineal
  const suma = crudos.reduce((a, b) => a + b, 0);
  return crudos.map((w) => w / suma);
}

/// Promedio ponderado de una serie (antiguo→reciente). Serie vacía → 0.
export function promedioPonderado(serie: number[], metodo: MetodoPonderacion): number {
  if (serie.length === 0) return 0;
  const w = pesos(serie.length, metodo);
  return serie.reduce((acc, x, i) => acc + x * w[i], 0);
}

/// Factor de estacionalidad = ventas(mismo periodo año pasado) / (periodo previo),
/// acotado a [min,max]. Datos faltantes o cero → 1 (neutro).
export function factorEstacional(
  mismoPeriodoAnioPasado: number,
  periodoAnterior: number,
  clamp: [number, number] = [0.5, 2],
): number {
  if (!periodoAnterior || !mismoPeriodoAnioPasado) return 1;
  const r = mismoPeriodoAnioPasado / periodoAnterior;
  return Math.min(Math.max(r, clamp[0]), clamp[1]);
}

/// Factor de tendencia por pendiente lineal de las últimas observaciones,
/// acotado a [min,max]. < 2 puntos o media 0 → 1.
export function factorTendencia(ultimas: number[], clamp: [number, number] = [0.5, 1.8]): number {
  const n = ultimas.length;
  if (n < 2) return 1;
  const media = ultimas.reduce((a, b) => a + b, 0) / n;
  if (media === 0) return 1;
  const xMedia = (n - 1) / 2;
  let num = 0;
  let den = 0;
  ultimas.forEach((y, i) => {
    num += (i - xMedia) * (y - media);
    den += (i - xMedia) ** 2;
  });
  const pendiente = den === 0 ? 0 : num / den;
  const factor = 1 + (pendiente / media) * 0.5;
  return Math.min(Math.max(factor, clamp[0]), clamp[1]);
}

export interface PronosticoInput {
  serie: number[]; // unidades por periodo, antiguo→reciente
  metodo: MetodoPonderacion;
  factorEstacional?: number;
  factorTendencia?: number;
  /// Factor de crecimiento manual (1 = sin ajuste).
  crecimiento?: number;
}

/// Unidades pronosticadas: promedio ponderado × estacional × tendencia × crecimiento.
/// Nunca negativo.
export function pronosticarUnidades(input: PronosticoInput): number {
  const base = promedioPonderado(input.serie, input.metodo);
  const u = base * (input.factorEstacional ?? 1) * (input.factorTendencia ?? 1) * (input.crecimiento ?? 1);
  return u > 0 ? u : 0;
}

/// Redondeo a múltiplos del mínimo de compra. qty ≤ 0 → 0; sin mínimo → qty.
export function redondearMinCompra(qty: DecimalLike, minCompra: DecimalLike): Decimal {
  const q = toDecimal(qty);
  const min = toDecimal(minCompra);
  if (q.lte(0)) return new Decimal(0);
  if (min.lte(0)) return q;
  const multiplos = q.div(min).ceil();
  return multiplos.mul(min);
}
