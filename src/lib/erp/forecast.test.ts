import { describe, it, expect } from "vitest";
import {
  pesos,
  promedioPonderado,
  factorEstacional,
  factorTendencia,
  pronosticarUnidades,
  redondearMinCompra,
  ocurrenciasEnHorizonte,
} from "./forecast";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("pesos", () => {
  it("suman 1 en cada método", () => {
    for (const m of ["lineal", "exponencial", "plano"] as const) {
      expect(sum(pesos(5, m))).toBeCloseTo(1, 10);
    }
  });
  it("plano reparte por igual", () => {
    expect(pesos(4, "plano")).toEqual([0.25, 0.25, 0.25, 0.25]);
  });
  it("el más reciente pesa más en lineal", () => {
    const w = pesos(3, "lineal");
    expect(w[2]).toBeGreaterThan(w[0]);
  });
  it("n=0 → []", () => {
    expect(pesos(0, "lineal")).toEqual([]);
  });
});

describe("promedioPonderado", () => {
  it("serie constante = ese valor", () => {
    expect(promedioPonderado([10, 10, 10], "exponencial")).toBeCloseTo(10, 10);
  });
  it("serie vacía → 0", () => {
    expect(promedioPonderado([], "lineal")).toBe(0);
  });
});

describe("factorEstacional", () => {
  it("ratio acotado a [0.5,2]", () => {
    expect(factorEstacional(300, 100)).toBe(2); // 3 → clamp 2
    expect(factorEstacional(10, 100)).toBe(0.5); // 0.1 → clamp 0.5
    expect(factorEstacional(120, 100)).toBeCloseTo(1.2, 10);
  });
  it("datos faltantes → 1", () => {
    expect(factorEstacional(0, 100)).toBe(1);
    expect(factorEstacional(100, 0)).toBe(1);
  });
});

describe("factorTendencia", () => {
  it("serie plana → 1", () => {
    expect(factorTendencia([10, 10, 10, 10])).toBe(1);
  });
  it("creciente → > 1 (acotado)", () => {
    expect(factorTendencia([10, 20, 30, 40])).toBeGreaterThan(1);
    expect(factorTendencia([1, 100, 1000, 100000])).toBeLessThanOrEqual(1.8);
  });
  it("< 2 puntos → 1", () => {
    expect(factorTendencia([5])).toBe(1);
  });
});

describe("pronosticarUnidades", () => {
  it("crecimiento 1.0 es neutro", () => {
    const base = promedioPonderado([10, 12, 14], "lineal");
    expect(pronosticarUnidades({ serie: [10, 12, 14], metodo: "lineal", crecimiento: 1 })).toBeCloseTo(base, 10);
  });
  it("aplica factores multiplicativos", () => {
    const u = pronosticarUnidades({ serie: [10, 10, 10], metodo: "plano", factorEstacional: 2, crecimiento: 1.5 });
    expect(u).toBeCloseTo(30, 10); // 10 * 2 * 1.5
  });
  it("nunca negativo y serie vacía → 0", () => {
    expect(pronosticarUnidades({ serie: [], metodo: "lineal" })).toBe(0);
  });
});

describe("ocurrenciasEnHorizonte", () => {
  it("mensual en 4 semanas ≈ 1, quincenal ≈ 2", () => {
    expect(ocurrenciasEnHorizonte("MENSUAL", 4)).toBe(1);
    expect(ocurrenciasEnHorizonte("QUINCENAL", 4)).toBe(2);
  });
  it("anual no ocurre en 4 semanas (0)", () => {
    expect(ocurrenciasEnHorizonte("ANUAL", 4)).toBe(0);
  });
  it("UNICA nunca es recurrente (0)", () => {
    expect(ocurrenciasEnHorizonte("UNICA", 52)).toBe(0);
  });
});

describe("redondearMinCompra", () => {
  it("redondea hacia arriba al múltiplo del mínimo", () => {
    expect(redondearMinCompra("7", "5").toString()).toBe("10");
    expect(redondearMinCompra("10", "5").toString()).toBe("10");
  });
  it("sin mínimo deja la cantidad; qty 0 → 0", () => {
    expect(redondearMinCompra("7", "0").toString()).toBe("7");
    expect(redondearMinCompra("0", "5").toString()).toBe("0");
  });
});
