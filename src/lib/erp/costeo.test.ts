import { describe, it, expect } from "vitest";
import {
  costoComponente,
  costoReceta,
  costoUnitarioInsumo,
  costoRecetaArbol,
  explotar,
  type Insumo,
} from "./costeo";

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

describe("costeo con semi-terminados (árbol)", () => {
  const harina: Insumo = { kind: "ingrediente", id: "harina", costoUnitario: 20 };
  const huevo: Insumo = { kind: "ingrediente", id: "huevo", costoUnitario: 3 };
  // Masa: 0.5 harina + 2 huevo = 10 + 6 = 16 por unidad de masa.
  const masa: Insumo = {
    kind: "semi",
    id: "masa",
    componentes: [
      { insumo: harina, cantidad: "0.5" },
      { insumo: huevo, cantidad: 2 },
    ],
  };

  it("costo unitario de un semi = suma de sus componentes", () => {
    expect(costoUnitarioInsumo(masa).toString()).toBe("16");
  });

  it("receta que usa un semi anidado", () => {
    // 2 masa (16 c/u) + 1 huevo = 32 + 3 = 35
    const total = costoRecetaArbol([
      { insumo: masa, cantidad: 2 },
      { insumo: huevo, cantidad: 1 },
    ]);
    expect(total.toString()).toBe("35");
  });

  it("semi anidado dentro de semi (2 niveles)", () => {
    const relleno: Insumo = {
      kind: "semi",
      id: "relleno",
      componentes: [{ insumo: masa, cantidad: 1 }, { insumo: huevo, cantidad: 1 }],
    };
    // relleno = 16 + 3 = 19
    expect(costoUnitarioInsumo(relleno).toString()).toBe("19");
  });

  it("detecta ciclos (un semi que se contiene a sí mismo)", () => {
    const ciclico: Insumo = { kind: "semi", id: "a", componentes: [] };
    (ciclico as { componentes: unknown[] }).componentes = [{ insumo: ciclico, cantidad: 1 }];
    expect(() => costoUnitarioInsumo(ciclico)).toThrow(/[Cc]iclo/);
  });
});

describe("explotar (BOM a ingredientes hoja)", () => {
  const harina: Insumo = { kind: "ingrediente", id: "harina", costoUnitario: 20 };
  const huevo: Insumo = { kind: "ingrediente", id: "huevo", costoUnitario: 3 };
  const masa: Insumo = {
    kind: "semi",
    id: "masa",
    componentes: [{ insumo: harina, cantidad: 1 }, { insumo: huevo, cantidad: 2 }],
  };

  it("suma cantidades de ingredientes a través de semis", () => {
    // 3 masa → 3 harina + 6 huevo ; + 1 huevo directo = 7 huevo
    const bom = explotar([
      { insumo: masa, cantidad: 3 },
      { insumo: huevo, cantidad: 1 },
    ]);
    expect(bom.get("harina")!.toString()).toBe("3");
    expect(bom.get("huevo")!.toString()).toBe("7");
  });

  it("aplica el rendimiento al explotar", () => {
    // 1 harina con rendimiento 50% → 2 harina
    const bom = explotar([{ insumo: harina, cantidad: 1, rendimiento: 50 }]);
    expect(bom.get("harina")!.toString()).toBe("2");
  });
});
