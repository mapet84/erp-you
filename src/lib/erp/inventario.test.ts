import { describe, it, expect } from "vitest";
import { recostearEntrada, aplicarSalida, aplicarDevolucion } from "./inventario";

describe("recostearEntrada (CPM/MAP)", () => {
  it("stock inicial 0 → CPM toma el costo de la entrada", () => {
    const r = recostearEntrada({ stock: 0, cpm: 0 }, 10, "5");
    expect(r.stock.toString()).toBe("10");
    expect(r.cpm.toString()).toBe("5");
    expect(r.valorTotal.toString()).toBe("50");
    expect(r.costoMovimiento.toString()).toBe("50");
  });

  it("promedio móvil correcto: 10@5 + 10@7 → CPM 6", () => {
    const r = recostearEntrada({ stock: 10, cpm: 5 }, 10, 7);
    expect(r.stock.toString()).toBe("20");
    expect(r.cpm.toString()).toBe("6");
  });

  it("compra al mismo precio mantiene el CPM", () => {
    const r = recostearEntrada({ stock: 8, cpm: 5 }, 4, 5);
    expect(r.cpm.toString()).toBe("5");
  });

  it("lanza si la cantidad no es positiva", () => {
    expect(() => recostearEntrada({ stock: 1, cpm: 1 }, 0, 1)).toThrow();
  });
});

describe("aplicarSalida", () => {
  it("baja stock y valúa al CPM vigente (movimiento firmado negativo)", () => {
    const r = aplicarSalida({ stock: 20, cpm: 6 }, 5);
    expect(r.stock.toString()).toBe("15");
    expect(r.cpm.toString()).toBe("6");
    expect(r.qty.toString()).toBe("-5");
    expect(r.costoMovimiento.toString()).toBe("-30");
  });

  it("permite stock negativo (sin lanzar)", () => {
    const r = aplicarSalida({ stock: 2, cpm: 6 }, 5);
    expect(r.stock.toString()).toBe("-3");
  });

  it("lanza si la cantidad no es positiva", () => {
    expect(() => aplicarSalida({ stock: 5, cpm: 1 }, -1)).toThrow();
  });
});

describe("aplicarDevolucion", () => {
  it("reingresa al CPM vigente (inverso de salida)", () => {
    const r = aplicarDevolucion({ stock: 15, cpm: 6 }, 5);
    expect(r.stock.toString()).toBe("20");
    expect(r.costoMovimiento.toString()).toBe("30");
  });
});
