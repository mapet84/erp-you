import { describe, it, expect } from "vitest";
import { pvSinIva, margen, precioDesdeMargen } from "./pricing";

describe("pvSinIva", () => {
  it("quita el IVA 16%", () => {
    expect(pvSinIva(116).toString()).toBe("100");
  });
});

describe("margen", () => {
  it("(pvSin − costo) / pvSin", () => {
    expect(margen(100, 40).toString()).toBe("0.6");
  });
  it("margen 0 cuando costo = precio", () => {
    expect(margen(100, 100).toString()).toBe("0");
  });
  it("negativo cuando el costo supera el precio", () => {
    expect(margen(100, 150).toNumber()).toBeLessThan(0);
  });
  it("evita división por cero (pvSin = 0 → 0)", () => {
    expect(margen(0, 10).toString()).toBe("0");
  });
});

describe("precioDesdeMargen", () => {
  it("costo 40, margen 60% → 100 sin IVA → 116 con IVA", () => {
    expect(precioDesdeMargen(40, 60).toString()).toBe("116");
  });

  it("margen 0% → precio = costo + IVA", () => {
    expect(precioDesdeMargen(100, 0).toString()).toBe("116");
  });

  it("redondea a 2 decimales", () => {
    // costo 33.33, margen 50% → 66.66 sin IVA → 77.3256 → 77.33
    expect(precioDesdeMargen("33.33", 50).toString()).toBe("77.33");
  });

  it("ida y vuelta: el margen del precio derivado coincide con el objetivo", () => {
    const precio = precioDesdeMargen(40, 60); // 116
    expect(margen(pvSinIva(precio), 40).toDecimalPlaces(4).toString()).toBe("0.6");
  });

  it("lanza si el margen objetivo ≥ 100%", () => {
    expect(() => precioDesdeMargen(40, 100)).toThrow();
  });
});
