import { describe, it, expect } from "vitest";
import { isRenderableEmisor, nombreParaMostrar } from "@/lib/emisor";

describe("isRenderableEmisor", () => {
  it("acepta un emisor activo", () => {
    expect(
      isRenderableEmisor({
        slug: "demo",
        razonSocial: "Panadería Demo SA de CV",
        activo: true,
        branding: {},
      }),
    ).toBe(true);
  });

  it("rechaza un emisor inactivo", () => {
    expect(
      isRenderableEmisor({
        slug: "inactivo",
        razonSocial: "Emisor Inactivo",
        activo: false,
        branding: {},
      }),
    ).toBe(false);
  });

  it("rechaza slug inexistente (null/undefined)", () => {
    expect(isRenderableEmisor(null)).toBe(false);
    expect(isRenderableEmisor(undefined)).toBe(false);
  });
});

describe("nombreParaMostrar", () => {
  it("prefiere el nombre comercial cuando existe", () => {
    expect(
      nombreParaMostrar({
        razonSocial: "Panadería Demo SA de CV",
        branding: { nombreComercial: "Panadería Demo" },
      }),
    ).toBe("Panadería Demo");
  });

  it("cae a la razón social si no hay nombre comercial", () => {
    expect(
      nombreParaMostrar({
        razonSocial: "Panadería Demo SA de CV",
        branding: {},
      }),
    ).toBe("Panadería Demo SA de CV");
  });

  it("ignora un nombre comercial en blanco", () => {
    expect(
      nombreParaMostrar({
        razonSocial: "Razón Social SA",
        branding: { nombreComercial: "   " },
      }),
    ).toBe("Razón Social SA");
  });
});
