// Helpers de dinero para el ERP (Fase 2).
//
// Todo el dinero se calcula y persiste con `Prisma.Decimal` (precisión exacta).
// Pero `Decimal` NO es serializable de un Server Component a un Client Component
// (Next.js solo pasa datos planos por el límite RSC→cliente). Por eso estas
// utilidades convierten a `string` antes de cruzar ese límite, y el cliente solo
// muestra; nunca calcula dinero con `number` (flotantes).

import { Prisma } from "@prisma/client";

/// Re-export para construir/operar Decimales sin importar Prisma en todos lados.
export const Decimal = Prisma.Decimal;
export type Decimal = Prisma.Decimal;

/// Cualquier cosa convertible a Decimal: el propio Decimal, número o string.
export type DecimalLike = Prisma.Decimal | number | string;

/// Normaliza a `Prisma.Decimal`. Lanza si el valor no es numérico.
export function toDecimal(value: DecimalLike): Prisma.Decimal {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
}

/// Decimal → string canónico (para cruzar el límite RSC→cliente).
export function decimalToString(value: DecimalLike): string {
  return toDecimal(value).toString();
}

/// Formatea un monto en pesos mexicanos: 1234.5 → "$1,234.50".
/// `conSimbolo=false` devuelve solo el número con separadores: "1,234.50".
export function formatMXN(value: DecimalLike, conSimbolo = true): string {
  const n = toDecimal(value).toNumber();
  return new Intl.NumberFormat("es-MX", {
    style: conSimbolo ? "currency" : "decimal",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/// Formatea un porcentaje guardado como número humano (16 = 16%): 16 → "16.00%".
export function formatPct(value: DecimalLike): string {
  return `${toDecimal(value).toFixed(2)}%`;
}

/// Convierte en profundidad cualquier `Decimal` dentro de `value` a `string`,
/// dejando intactos primitivos, fechas, arrays y objetos planos. Úsalo en una
/// página servidor para preparar datos antes de pasarlos a un Client Component.
export function serializeDecimals<T>(value: T): Serialized<T> {
  if (value instanceof Prisma.Decimal) {
    return value.toString() as Serialized<T>;
  }
  if (value === null || typeof value !== "object") {
    return value as Serialized<T>;
  }
  if (value instanceof Date) {
    return value as Serialized<T>;
  }
  if (Array.isArray(value)) {
    return value.map((v) => serializeDecimals(v)) as Serialized<T>;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = serializeDecimals(v);
  }
  return out as Serialized<T>;
}

/// Tipo resultante de `serializeDecimals`: cada `Decimal` se vuelve `string`.
export type Serialized<T> = T extends Prisma.Decimal
  ? string
  : T extends Date
    ? Date
    : T extends Array<infer U>
      ? Array<Serialized<U>>
      : T extends object
        ? { [K in keyof T]: Serialized<T[K]> }
        : T;
