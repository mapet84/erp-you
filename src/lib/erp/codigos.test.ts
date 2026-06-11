import { describe, it, expect } from "vitest";
import { abreviar, siguienteNumero, prefijoReceta } from "./codigos";

describe("abreviar", () => {
  it("quita acentos, espacios y deja 3 mayúsculas", () => {
    expect(abreviar("Panadería")).toBe("PAN");
    expect(abreviar("Postres")).toBe("POS");
    expect(abreviar("Individual")).toBe("IND");
  });
  it("colapsa no alfanuméricos y rellena vacíos", () => {
    expect(abreviar("a-b c")).toBe("ABC");
    expect(abreviar("###")).toBe("X");
  });
});

describe("siguienteNumero", () => {
  it("toma el máximo del prefijo y suma 1, con padding", () => {
    expect(siguienteNumero(["POSIND001", "POSIND002", "BEB001"], "POSIND")).toBe("003");
  });
  it("empieza en 001 si no hay ninguno", () => {
    expect(siguienteNumero(["BEB001"], "POSIND")).toBe("001");
    expect(siguienteNumero([], "PAN")).toBe("001");
  });
  it("ignora valores que no cuadran con el prefijo", () => {
    expect(siguienteNumero(["PANxx", "PAN005"], "PAN")).toBe("006");
  });
});

describe("prefijoReceta", () => {
  it("concatena abreviaturas de categoría y tamaño", () => {
    expect(prefijoReceta("POS", "IND")).toBe("POSIND");
    expect(prefijoReceta("BEB", "")).toBe("BEB");
  });
});
