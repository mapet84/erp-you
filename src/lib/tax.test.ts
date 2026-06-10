import { describe, it, expect } from "vitest";
import { desglosarIva } from "./tax";

describe("desglosarIva · cuadre exacto subtotal + iva === total", () => {
  // Incluye casos que descuadran a centavos, .01/.99, montos de 1 peso y grandes.
  const totales = [
    1, 1.01, 1.16, 0.99, 5, 10, 11.6, 100, 116, 116.0, 123.45, 250.5, 999.99,
    1000, 1234.56, 9999.99, 100000, 87654.32,
  ];

  for (const total of totales) {
    it(`total ${total} → subtotal + iva === total`, () => {
      const r = desglosarIva(total);
      // Comparar en centavos para evitar ruido de flotante.
      expect(Math.round(r.subtotal * 100) + Math.round(r.iva * 100)).toBe(
        Math.round(total * 100),
      );
      expect(r.total).toBe(total);
      // Cada parte tiene a lo más 2 decimales.
      expect(Number(r.subtotal.toFixed(2))).toBe(r.subtotal);
      expect(Number(r.iva.toFixed(2))).toBe(r.iva);
    });
  }
});

describe("desglosarIva · valores conocidos", () => {
  it("116.00 al 16% → 100.00 + 16.00", () => {
    expect(desglosarIva(116)).toMatchObject({ subtotal: 100, iva: 16 });
  });

  it("1.16 al 16% → 1.00 + 0.16", () => {
    expect(desglosarIva(1.16)).toMatchObject({ subtotal: 1, iva: 0.16 });
  });

  it("100.00 al 16% → 86.21 + 13.79 (residuo en el IVA)", () => {
    const r = desglosarIva(100);
    expect(r.subtotal).toBe(86.21);
    expect(r.iva).toBe(13.79);
  });

  it("respeta una tasa distinta (0.08 frontera)", () => {
    const r = desglosarIva(108, 0.08);
    expect(r.subtotal).toBe(100);
    expect(r.iva).toBe(8);
    expect(r.tasa).toBe(0.08);
  });
});

describe("desglosarIva · entradas inválidas", () => {
  it("rechaza total <= 0", () => {
    expect(() => desglosarIva(0)).toThrow();
    expect(() => desglosarIva(-5)).toThrow();
  });
  it("rechaza total no finito", () => {
    expect(() => desglosarIva(NaN)).toThrow();
    expect(() => desglosarIva(Infinity)).toThrow();
  });
  it("rechaza tasa negativa", () => {
    expect(() => desglosarIva(100, -0.1)).toThrow();
  });
});
