// Lógica pura de códigos/SKU (sin BD).
//
// - Ingrediente: consecutivo 100001–199999 (ver codigos.server).
// - Receta (producto terminado): abrevCategoría + abrevTamaño + consecutivo.
// - Producto (no-receta): abrevCategoría + consecutivo.
// - Semi-terminado: "ST" + consecutivo.

/// Abreviatura de un nombre: sin acentos, mayúsculas, alfanumérico, 3 caracteres.
export function abreviar(nombre: string, ancho = 3): string {
  const limpio = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return limpio.slice(0, ancho) || "X";
}

/// Siguiente número consecutivo (cadena con padding) para los valores que
/// empiezan con `prefijo`. Ignora los que no cuadran. Empieza en 1.
export function siguienteNumero(valores: string[], prefijo: string, ancho = 3): string {
  let max = 0;
  for (const v of valores) {
    if (!v.startsWith(prefijo)) continue;
    const n = parseInt(v.slice(prefijo.length), 10);
    if (Number.isInteger(n) && n > max) max = n;
  }
  return String(max + 1).padStart(ancho, "0");
}

/// Prefijo de SKU de receta a partir de las abreviaturas de categoría y tamaño.
export function prefijoReceta(abrevCategoria: string, abrevTamano: string): string {
  return `${abrevCategoria}${abrevTamano}`;
}
