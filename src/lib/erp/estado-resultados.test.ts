import { describe, it, expect } from "vitest";
import { construirEstadoResultados } from "./estado-resultados";

describe("construirEstadoResultados", () => {
  it("calcula utilidad bruta, EBIT y neta", () => {
    const er = construirEstadoResultados(
      [{ subtotalSinIva: 1000, comisionMonto: 50, costo: 400 }],
      [
        { tipoER: "GASTO_OPERATIVO_ADMIN", monto: 200 },
        { tipoER: "GASTO_OPERATIVO_VENTAS", monto: 100 },
      ],
    );
    expect(er.ingresosNetos.toString()).toBe("1000");
    expect(er.utilidadBruta.toString()).toBe("550"); // 1000-400-50
    expect(er.ebit.toString()).toBe("250"); // 550-200-100
    expect(er.utilidadNeta.toString()).toBe("250");
    expect(er.margenBruto.toString()).toBe("55");
  });

  it("OTRO_INGRESO suma y OTRO_GASTO/IMPUESTO restan en UAI/neta", () => {
    const er = construirEstadoResultados(
      [{ subtotalSinIva: 1000, comisionMonto: 0, costo: 0 }],
      [
        { tipoER: "OTRO_INGRESO", monto: 100 },
        { tipoER: "OTRO_GASTO", monto: 40 },
        { tipoER: "IMPUESTO", monto: 60 },
      ],
    );
    // EBIT=1000 ; UAI=1000+100-40=1060 ; neta=1060-60=1000
    expect(er.ebit.toString()).toBe("1000");
    expect(er.uai.toString()).toBe("1060");
    expect(er.impuestos.toString()).toBe("60");
    expect(er.utilidadNeta.toString()).toBe("1000");
  });

  it("suma el ISR retenido de los gastos a impuestos", () => {
    const er = construirEstadoResultados(
      [{ subtotalSinIva: 500, comisionMonto: 0, costo: 0 }],
      [{ tipoER: "GASTO_OPERATIVO_ADMIN", monto: 100, isr: 10 }],
    );
    expect(er.impuestos.toString()).toBe("10");
    expect(er.utilidadNeta.toString()).toBe("390"); // 500-100 = 400 EBIT ; -10 ISR
  });

  it("una devolución (subtotal negativo) reduce ingresos netos", () => {
    const er = construirEstadoResultados(
      [
        { subtotalSinIva: 1000, comisionMonto: 0, costo: 400 },
        { subtotalSinIva: -200, comisionMonto: 0, costo: -80 },
      ],
      [],
    );
    expect(er.ingresosNetos.toString()).toBe("800");
    expect(er.costoVentas.toString()).toBe("320");
    expect(er.utilidadBruta.toString()).toBe("480");
  });

  it("rango vacío → todo en cero, márgenes 0", () => {
    const er = construirEstadoResultados([], []);
    expect(er.ingresosNetos.toString()).toBe("0");
    expect(er.utilidadNeta.toString()).toBe("0");
    expect(er.margenBruto.toString()).toBe("0");
  });
});
