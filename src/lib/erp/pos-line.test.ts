import { describe, it, expect } from "vitest";
import { calcularLineaVenta, agregarTicket } from "./pos-line";

describe("calcularLineaVenta", () => {
  it("venta simple con IVA, sin comisión", () => {
    // 2 × 116 = 232 ; sin IVA 200 ; IVA 32 ; costo 2×60=120 ; utilidad 200−120=80
    const l = calcularLineaVenta({ precioUnit: 116, qty: 2, costoUnitario: 60 });
    expect(l.totalVenta.toString()).toBe("232");
    expect(l.subtotalSinIva.toString()).toBe("200");
    expect(l.iva.toString()).toBe("32");
    expect(l.comisionMonto.toString()).toBe("0");
    expect(l.costo.toString()).toBe("120");
    expect(l.utilidadMonto.toString()).toBe("80");
  });

  it("cuadre: subtotalSinIva + iva === totalVenta", () => {
    const l = calcularLineaVenta({ precioUnit: "99.90", qty: 3, costoUnitario: 10 });
    expect(l.subtotalSinIva.plus(l.iva).toString()).toBe(l.totalVenta.toString());
  });

  it("aplica comisión sobre el subtotal sin IVA", () => {
    // 116 → sin IVA 100 ; comisión 5% = 5 ; costo 40 ; utilidad 100−5−40=55
    const l = calcularLineaVenta({ precioUnit: 116, qty: 1, comisionPct: 5, costoUnitario: 40 });
    expect(l.comisionMonto.toString()).toBe("5");
    expect(l.utilidadMonto.toString()).toBe("55");
  });

  it("devolución (qty negativa) deja todos los montos negativos", () => {
    const l = calcularLineaVenta({ precioUnit: 116, qty: -1, comisionPct: 5, costoUnitario: 40 });
    expect(l.totalVenta.toString()).toBe("-116");
    expect(l.subtotalSinIva.toString()).toBe("-100");
    expect(l.costo.toString()).toBe("-40");
    expect(l.utilidadMonto.toString()).toBe("-55");
  });

  it("línea en cero no truena (precio o qty 0)", () => {
    const l = calcularLineaVenta({ precioUnit: 0, qty: 3, costoUnitario: 1 });
    expect(l.totalVenta.toString()).toBe("0");
    expect(l.utilidadMonto.toString()).toBe("0");
  });
});

describe("agregarTicket", () => {
  it("suma los totales de varias líneas", () => {
    const a = calcularLineaVenta({ precioUnit: 116, qty: 1, costoUnitario: 40 });
    const b = calcularLineaVenta({ precioUnit: 58, qty: 2, costoUnitario: 10 });
    const t = agregarTicket([a, b]);
    expect(t.totalVenta.toString()).toBe("232");
    expect(t.subtotalSinIva.plus(t.iva).toString()).toBe(t.totalVenta.toString());
  });
});
