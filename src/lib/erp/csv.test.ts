import { describe, it, expect } from "vitest";
import { parseCsv, parseCsvObjects } from "./csv";

describe("parseCsv", () => {
  it("separa filas y columnas simples", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([["a", "b", "c"], ["1", "2", "3"]]);
  });
  it("respeta comas y saltos dentro de comillas", () => {
    expect(parseCsv('nombre,nota\n"Pan, blanco","línea1\nlínea2"')).toEqual([
      ["nombre", "nota"],
      ["Pan, blanco", "línea1\nlínea2"],
    ]);
  });
  it("comillas escapadas como dobles", () => {
    expect(parseCsv('a\n"di ""hola"""')).toEqual([["a"], ['di "hola"']]);
  });
  it("ignora filas vacías", () => {
    expect(parseCsv("a\n\n\nb")).toEqual([["a"], ["b"]]);
  });
});

describe("parseCsvObjects", () => {
  it("usa la cabecera (normalizada) como llaves", () => {
    const o = parseCsvObjects("Nombre, Unidad ,Costo\nHarina,KG,20");
    expect(o).toEqual([{ nombre: "Harina", unidad: "KG", costo: "20" }]);
  });
  it("sin filas de datos → []", () => {
    expect(parseCsvObjects("a,b")).toEqual([]);
  });
});
