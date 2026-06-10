import { describe, it, expect } from "vitest";
import {
  esRfcValido,
  tipoPersona,
  esCpValido,
  perteneceACatalogo,
  receptorSchema,
  dentroDeVentana,
} from "./billing-rules";

describe("RFC · formato y tipo de persona", () => {
  it("acepta persona moral (12) y la clasifica", () => {
    expect(esRfcValido("EKU9003173C9")).toBe(true);
    expect(tipoPersona("EKU9003173C9")).toBe("moral");
  });
  it("acepta persona física (13) y la clasifica", () => {
    expect(esRfcValido("XAXX010101000")).toBe(true);
    expect(tipoPersona("XAXX010101000")).toBe("fisica");
  });
  it("normaliza minúsculas y espacios", () => {
    expect(esRfcValido("  eku9003173c9 ")).toBe(true);
  });
  it("rechaza longitudes inválidas (11, 14) y basura", () => {
    expect(esRfcValido("EKU900317C9")).toBe(false); // 11
    expect(esRfcValido("XAXX0101010000")).toBe(false); // 14
    expect(esRfcValido("123456789012")).toBe(false); // sin letras
    expect(esRfcValido("")).toBe(false);
    expect(tipoPersona("no-rfc")).toBeNull();
  });
});

describe("CP · 5 dígitos", () => {
  it("acepta 5 dígitos", () => {
    expect(esCpValido("06000")).toBe(true);
  });
  it("rechaza longitud distinta o no numérico", () => {
    expect(esCpValido("1234")).toBe(false);
    expect(esCpValido("123456")).toBe(false);
    expect(esCpValido("abcde")).toBe(false);
  });
});

describe("perteneceACatalogo", () => {
  it("verifica pertenencia", () => {
    expect(perteneceACatalogo("601", ["601", "612"])).toBe(true);
    expect(perteneceACatalogo("999", ["601", "612"])).toBe(false);
  });
});

describe("receptorSchema · formato + catálogos", () => {
  const schema = receptorSchema({
    regimenFiscal: ["601", "612", "616"],
    usoCfdi: ["G03", "S01"],
    formaPago: ["01", "03"],
  });
  const valido = {
    rfc: "xaxx010101000",
    nombre: "Juan Pérez",
    cp: "06000",
    regimenFiscal: "612",
    usoCfdi: "G03",
    formaPago: "03",
    email: "juan@example.com",
  };

  it("acepta datos válidos y normaliza el RFC", () => {
    const r = schema.safeParse(valido);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.rfc).toBe("XAXX010101000");
  });

  it("rechaza clave fuera de catálogo (régimen)", () => {
    const r = schema.safeParse({ ...valido, regimenFiscal: "999" });
    expect(r.success).toBe(false);
  });
  it("rechaza uso de CFDI fuera de catálogo", () => {
    expect(schema.safeParse({ ...valido, usoCfdi: "X99" }).success).toBe(false);
  });
  it("rechaza RFC, CP y correo mal formados", () => {
    expect(schema.safeParse({ ...valido, rfc: "BAD" }).success).toBe(false);
    expect(schema.safeParse({ ...valido, cp: "123" }).success).toBe(false);
    expect(schema.safeParse({ ...valido, email: "no-mail" }).success).toBe(false);
  });
});

describe("dentroDeVentana · mismo mes calendario", () => {
  const ahora = new Date(2026, 5, 10); // 10 jun 2026 (mes index 5)

  it("acepta una fecha del mismo mes", () => {
    expect(dentroDeVentana(new Date(2026, 5, 1), ahora).ok).toBe(true);
    expect(dentroDeVentana(new Date(2026, 5, 30), ahora).ok).toBe(true);
  });
  it("rechaza el mes anterior (cruce de fin de mes)", () => {
    const r = dentroDeVentana(new Date(2026, 4, 31), ahora); // 31 may
    expect(r.ok).toBe(false);
    expect(r.motivo).toMatch(/ventana/i);
  });
  it("rechaza el mismo mes de otro año", () => {
    expect(dentroDeVentana(new Date(2025, 5, 10), ahora).ok).toBe(false);
  });
  it("rechaza fecha inválida", () => {
    expect(dentroDeVentana(new Date("nope"), ahora).ok).toBe(false);
  });
});
