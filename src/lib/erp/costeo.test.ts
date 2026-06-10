import { describe, it, expect } from "vitest";
import { costoComponente, costoReceta } from "./costeo";

describe("costoComponente", () => {
  it("rendimiento 100% = costo × cantidad", () => {
    expect(costoComponente({ costoUnitario: 10, cantidad: 3 }).toString()).toBe("30");
  });

  it("rendimiento 50% duplica el costo", () => {
    expect(
      costoComponente({ costoUnitario: 10, cantidad: 2, rendimiento: 50 }).toString(),
    ).toBe("40");
  });

  it("rendimiento por defecto es 100", () => {
    expect(costoComponente({ costoUnitario: "2.5", cantidad: "4" }).toString()).toBe("10");
  });

  it("lanza si el rendimiento es 0 o negativo", () => {
    expect(() => costoComponente({ costoUnitario: 1, cantidad: 1, rendimiento: 0 })).toThrow();
  });
});

describe("costoReceta", () => {
  it("suma exacta de componentes (sin error de flotante)", () => {
    const total = costoReceta([
      { costoUnitario: "0.1", cantidad: 1 },
      { costoUnitario: "0.2", cantidad: 1 },
    ]);
    expect(total.toString()).toBe("0.3");
  });

  it("receta vacía cuesta 0", () => {
    expect(costoReceta([]).toString()).toBe("0");
  });

  it("combina cantidades y rendimientos mixtos", () => {
    // 10*2/1 + 5*4/(0.8) = 20 + 25 = 45
    const total = costoReceta([
      { costoUnitario: 10, cantidad: 2 },
      { costoUnitario: 5, cantidad: 4, rendimiento: 80 },
    ]);
    expect(total.toString()).toBe("45");
  });
});
