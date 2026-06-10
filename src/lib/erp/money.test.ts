import { describe, it, expect } from "vitest";
import {
  Decimal,
  toDecimal,
  decimalToString,
  formatMXN,
  formatPct,
  serializeDecimals,
} from "./money";

describe("toDecimal", () => {
  it("normaliza número, string y Decimal al mismo valor", () => {
    expect(toDecimal(1234.56).toString()).toBe("1234.56");
    expect(toDecimal("1234.56").toString()).toBe("1234.56");
    expect(toDecimal(new Decimal("1234.56")).toString()).toBe("1234.56");
  });

  it("conserva precisión que un flotante perdería", () => {
    // 0.1 + 0.2 en flotante es 0.30000000000000004; con Decimal es exacto.
    expect(toDecimal("0.1").plus("0.2").toString()).toBe("0.3");
  });
});

describe("decimalToString (round-trip RSC→cliente)", () => {
  it("ida y vuelta string → Decimal → string es estable", () => {
    const original = "987654.321000";
    const round = decimalToString(toDecimal(original));
    expect(round).toBe("987654.321");
    // Y reconstruir desde el string da el mismo número.
    expect(toDecimal(round).equals(new Decimal(original))).toBe(true);
  });
});

describe("formatMXN", () => {
  it("formatea pesos con símbolo y dos decimales", () => {
    expect(formatMXN(1234.5)).toBe("$1,234.50");
    expect(formatMXN("0")).toBe("$0.00");
  });

  it("sin símbolo devuelve solo el número con separadores", () => {
    expect(formatMXN(1234.5, false)).toBe("1,234.50");
  });
});

describe("formatPct", () => {
  it("formatea un porcentaje humano (16 = 16%)", () => {
    expect(formatPct(16)).toBe("16.00%");
    expect(formatPct("8.5")).toBe("8.50%");
  });
});

describe("serializeDecimals", () => {
  it("convierte Decimales anidados a string y deja lo demás intacto", () => {
    const fecha = new Date("2026-06-10T00:00:00.000Z");
    const input = {
      nombre: "Receta",
      activo: true,
      costo: new Decimal("12.345600"),
      fecha,
      lineas: [
        { qty: 2, precio: new Decimal("99.90") },
        { qty: 1, precio: new Decimal("0") },
      ],
    };

    const out = serializeDecimals(input);

    expect(out.nombre).toBe("Receta");
    expect(out.activo).toBe(true);
    expect(out.costo).toBe("12.3456");
    expect(out.fecha).toBe(fecha); // Date intacta
    expect(out.lineas[0].precio).toBe("99.9");
    expect(out.lineas[1].precio).toBe("0");
    // No quedan instancias de Decimal en la salida.
    expect(out.costo).toBeTypeOf("string");
    expect(out.lineas[0].precio).toBeTypeOf("string");
  });

  it("maneja null y primitivos sueltos", () => {
    expect(serializeDecimals(null)).toBeNull();
    expect(serializeDecimals(42)).toBe(42);
    expect(serializeDecimals("hola")).toBe("hola");
    expect(serializeDecimals(new Decimal("5"))).toBe("5");
  });
});
