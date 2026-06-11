// Parser CSV mínimo (puro). Soporta comillas, comas y saltos de línea dentro de
// campos entrecomillados, y comillas escapadas como "".

export function parseCsv(texto: string): string[][] {
  const s = texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  // Quita filas totalmente vacías.
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/// Igual que parseCsv pero usa la primera fila como encabezados y devuelve
/// objetos { encabezado(min,trim): valor(trim) }.
export function parseCsvObjects(texto: string): Record<string, string>[] {
  const filas = parseCsv(texto);
  if (filas.length < 2) return [];
  const headers = filas[0].map((h) => h.trim().toLowerCase());
  return filas.slice(1).map((f) => {
    const o: Record<string, string> = {};
    headers.forEach((h, i) => { o[h] = (f[i] ?? "").trim(); });
    return o;
  });
}
