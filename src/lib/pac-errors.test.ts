import { describe, it, expect } from "vitest";
import { traducirErrorPac, extraerDetallePac } from "./pac-errors";

describe("extraerDetallePac", () => {
  it("junta los mensajes de ModelState", () => {
    const body = {
      Message: "La solicitud no es válida.",
      ModelState: { "cfdiToCreate.Issuer.Rfc": ["El campo Nombre del emisor, debe pertenecer…"] },
    };
    expect(extraerDetallePac(body)).toContain("debe pertenecer");
  });

  it("cae a Message si no hay ModelState", () => {
    expect(extraerDetallePac({ Message: "Algo salió mal" })).toBe("Algo salió mal");
  });

  it("usa el fallback si el body es inútil", () => {
    expect(extraerDetallePac(null, "fallback")).toBe("fallback");
  });
});

describe("traducirErrorPac", () => {
  it("traduce nombre del receptor que no coincide (caso real EKU)", () => {
    const r = traducirErrorPac({
      message: "La solicitud no es válida.",
      body: {
        ModelState: {
          "cfdiToCreate.Issuer.Rfc": [
            "El campo Nombre del emisor, debe pertenecer al nombre asociado al RFC registrado en el campo Rfc del Emisor.",
          ],
        },
      },
    });
    expect(r.mensaje).toMatch(/nombre.*Constancia de Situación Fiscal/i);
    expect(r.detalle).toContain("debe pertenecer");
  });

  it("traduce DomicilioFiscalReceptor (caso real CP)", () => {
    const r = traducirErrorPac({
      message: "La solicitud no es válida.",
      body: {
        Message:
          "El campo DomicilioFiscalReceptor del receptor, debe encontrarse en la lista de RFC inscritos no cancelados en el SAT.",
      },
    });
    expect(r.mensaje).toMatch(/c[oó]digo postal/i);
  });

  it("traduce RFC inválido", () => {
    const r = traducirErrorPac({ body: { Message: "El RFC no es válido." } });
    expect(r.mensaje).toMatch(/RFC no es v[aá]lido/i);
  });

  it("traduce problema de sello / CSD", () => {
    const r = traducirErrorPac({ body: { Message: "El sello digital no es correcto." } });
    expect(r.mensaje).toMatch(/sello digital/i);
  });

  it("da un mensaje genérico accionable ante un error desconocido", () => {
    const r = traducirErrorPac({ message: "Boom", body: { Message: "xyzzy raro" } });
    expect(r.mensaje).toMatch(/No se pudo timbrar/i);
    expect(r.detalle).toBe("xyzzy raro");
  });
});
