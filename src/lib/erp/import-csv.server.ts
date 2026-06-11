// Importación masiva por CSV de ingredientes, productos, semi-terminados y
// recetas. Resuelve catálogos por nombre (los crea si faltan), asigna los
// códigos automáticos y es idempotente por nombre. Devuelve un resumen.

import { prisma } from "@/lib/db";
import { abreviar, siguienteNumero, prefijoReceta } from "./codigos";
import { parseCsvObjects } from "./csv";

export interface ResultadoImport {
  creados: number;
  saltados: number;
  errores: string[];
}

const numero = (v: string) => (v === "" || Number.isNaN(Number(v)) ? null : Number(v));

async function ensureUnidad(codigoRaw: string, cache: Map<string, string>): Promise<string | null> {
  const codigo = codigoRaw.trim().toUpperCase();
  if (!codigo) return null;
  if (cache.has(codigo)) return cache.get(codigo)!;
  const u = await prisma.unidad.upsert({ where: { codigo }, update: {}, create: { codigo, nombre: codigo } });
  cache.set(codigo, u.id);
  return u.id;
}

async function ensureCategoria(nombreRaw: string, cache: Map<string, string>): Promise<string | null> {
  const nombre = nombreRaw.trim();
  if (!nombre) return null;
  const key = nombre.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;
  const c = await prisma.categoria.upsert({ where: { nombre }, update: {}, create: { nombre, abreviatura: abreviar(nombre) } });
  cache.set(key, c.id);
  return c.id;
}

async function ensureTamano(nombreRaw: string, cache: Map<string, string>): Promise<string | null> {
  const nombre = nombreRaw.trim();
  if (!nombre) return null;
  const key = nombre.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;
  const t = await prisma.tamano.upsert({ where: { nombre }, update: {}, create: { nombre, abreviatura: abreviar(nombre) } });
  cache.set(key, t.id);
  return t.id;
}

// ── Ingredientes: nombre, unidad, costo, min_compra ──────────────────────────
export async function importarIngredientes(texto: string): Promise<ResultadoImport> {
  const filas = parseCsvObjects(texto);
  const errores: string[] = [];
  let creados = 0;
  let saltados = 0;

  const unidades = new Map<string, string>();
  const existentes = await prisma.ingrediente.findMany({ select: { codigo: true, nombre: true } });
  const nombres = new Set(existentes.map((e) => e.nombre.toLowerCase()));
  let max = 100000;
  for (const e of existentes) {
    const n = Number(e.codigo);
    if (Number.isInteger(n) && n >= 100001 && n <= 199999 && n > max) max = n;
  }

  for (const [idx, r] of filas.entries()) {
    const nombre = (r.nombre ?? r.ingrediente ?? "").trim();
    if (!nombre) { errores.push(`Fila ${idx + 2}: falta nombre`); continue; }
    if (nombres.has(nombre.toLowerCase())) { saltados++; continue; }
    const costo = numero(r.costo ?? r["costo (mxn)"] ?? "");
    if (costo === null) { errores.push(`Fila ${idx + 2} (${nombre}): costo inválido`); continue; }
    const unidadId = await ensureUnidad(r.unidad ?? "PZA", unidades);
    if (!unidadId) { errores.push(`Fila ${idx + 2} (${nombre}): unidad inválida`); continue; }
    max += 1;
    await prisma.ingrediente.create({
      data: { codigo: String(max), nombre, unidadId, costoCompra: String(costo), minCompra: String(numero(r.min_compra ?? r.min ?? "0") ?? 0) },
    });
    nombres.add(nombre.toLowerCase());
    creados++;
  }
  return { creados, saltados, errores };
}

// ── Productos: descripcion, categoria, unidad, costo ─────────────────────────
export async function importarProductos(texto: string): Promise<ResultadoImport> {
  const filas = parseCsvObjects(texto);
  const errores: string[] = [];
  let creados = 0;
  let saltados = 0;

  const cats = new Map<string, string>();
  const unidades = new Map<string, string>();
  const existentes = await prisma.producto.findMany({ select: { codigo: true, descripcion: true } });
  const descripciones = new Set(existentes.map((e) => e.descripcion.toLowerCase()));
  const codigos = existentes.map((e) => e.codigo);

  for (const [idx, r] of filas.entries()) {
    const descripcion = (r.descripcion ?? r.nombre ?? "").trim();
    if (!descripcion) { errores.push(`Fila ${idx + 2}: falta descripción`); continue; }
    if (descripciones.has(descripcion.toLowerCase())) { saltados++; continue; }
    const categoriaId = await ensureCategoria(r.categoria ?? "", cats);
    if (!categoriaId) { errores.push(`Fila ${idx + 2} (${descripcion}): falta categoría`); continue; }
    const unidadId = await ensureUnidad(r.unidad ?? "PZA", unidades);
    const costo = numero(r.costo ?? "0") ?? 0;
    const cat = await prisma.categoria.findUniqueOrThrow({ where: { id: categoriaId }, select: { abreviatura: true, nombre: true } });
    const prefijo = (cat.abreviatura?.trim()?.toUpperCase()) || abreviar(cat.nombre);
    const codigo = `${prefijo}${siguienteNumero(codigos, prefijo)}`;
    await prisma.producto.create({ data: { codigo, descripcion, categoriaId, unidadId: unidadId!, costo: String(costo) } });
    codigos.push(codigo);
    descripciones.add(descripcion.toLowerCase());
    creados++;
  }
  return { creados, saltados, errores };
}

type CompRow = { tipo: string; componente: string; cantidad: string; rendimiento: string };

async function resolverComponentes(
  comps: CompRow[],
  idx: number,
  ingPorNombre: Map<string, string>,
  semiPorNombre: Map<string, string>,
  errores: string[],
  forReceta: boolean,
): Promise<{ ingredienteId?: string; semiTerminadoId?: string; hijoId?: string; cantidad: string; rendimiento: string }[] | null> {
  const out: { ingredienteId?: string; semiTerminadoId?: string; hijoId?: string; cantidad: string; rendimiento: string }[] = [];
  for (const c of comps) {
    const cantidad = numero(c.cantidad);
    if (cantidad === null || cantidad <= 0) { errores.push(`Fila ${idx}: cantidad inválida en "${c.componente}"`); return null; }
    const rendimiento = String(numero(c.rendimiento) ?? 100);
    const esSemi = (c.tipo ?? "").toLowerCase().startsWith("semi");
    if (esSemi) {
      const id = semiPorNombre.get(c.componente.trim().toLowerCase());
      if (!id) { errores.push(`Fila ${idx}: semi-terminado "${c.componente}" no existe`); return null; }
      out.push(forReceta ? { semiTerminadoId: id, cantidad: String(cantidad), rendimiento } : { hijoId: id, cantidad: String(cantidad), rendimiento });
    } else {
      const id = ingPorNombre.get(c.componente.trim().toLowerCase());
      if (!id) { errores.push(`Fila ${idx}: ingrediente "${c.componente}" no existe`); return null; }
      out.push({ ingredienteId: id, cantidad: String(cantidad), rendimiento });
    }
  }
  return out;
}

function agrupar(filas: Record<string, string>[], clave: string): Map<string, Record<string, string>[]> {
  const m = new Map<string, Record<string, string>[]>();
  for (const f of filas) {
    const k = (f[clave] ?? "").trim();
    if (!k) continue;
    (m.get(k) ?? m.set(k, []).get(k)!).push(f);
  }
  return m;
}

// ── Semi-terminados: semiterminado, tipo, componente, cantidad, rendimiento ──
export async function importarSemiTerminados(texto: string): Promise<ResultadoImport> {
  const filas = parseCsvObjects(texto);
  const errores: string[] = [];
  let creados = 0;
  let saltados = 0;

  const ings = await prisma.ingrediente.findMany({ select: { id: true, nombre: true } });
  const ingPorNombre = new Map(ings.map((i) => [i.nombre.toLowerCase(), i.id]));
  const semis = await prisma.semiTerminado.findMany({ select: { id: true, sku: true, nombre: true } });
  const semiPorNombre = new Map(semis.map((s) => [s.nombre.toLowerCase(), s.id]));
  const skus = semis.map((s) => s.sku);

  const grupos = agrupar(filas, "semiterminado");
  for (const [nombre, comps] of grupos) {
    if (semiPorNombre.has(nombre.toLowerCase())) { saltados++; continue; }
    const componentes = await resolverComponentes(
      comps.map((c) => ({ tipo: c.tipo, componente: c.componente, cantidad: c.cantidad, rendimiento: c.rendimiento })),
      0, ingPorNombre, semiPorNombre, errores, false,
    );
    if (!componentes) { errores.push(`Semi "${nombre}" omitido por error en componentes`); continue; }
    const sku = `ST${siguienteNumero(skus, "ST")}`;
    const creado = await prisma.semiTerminado.create({ data: { sku, nombre, componentes: { create: componentes } } });
    skus.push(sku);
    semiPorNombre.set(nombre.toLowerCase(), creado.id);
    creados++;
  }
  return { creados, saltados, errores };
}

// ── Recetas: receta, categoria, tamano, tipo, componente, cantidad, rendimiento
export async function importarRecetas(texto: string): Promise<ResultadoImport> {
  const filas = parseCsvObjects(texto);
  const errores: string[] = [];
  let creados = 0;
  let saltados = 0;

  const cats = new Map<string, string>();
  const tams = new Map<string, string>();
  const ings = await prisma.ingrediente.findMany({ select: { id: true, nombre: true } });
  const ingPorNombre = new Map(ings.map((i) => [i.nombre.toLowerCase(), i.id]));
  const semis = await prisma.semiTerminado.findMany({ select: { id: true, nombre: true } });
  const semiPorNombre = new Map(semis.map((s) => [s.nombre.toLowerCase(), s.id]));
  const existentes = await prisma.receta.findMany({ select: { sku: true, nombre: true } });
  const nombresReceta = new Set(existentes.map((e) => e.nombre.toLowerCase()));
  const skus = existentes.map((e) => e.sku);

  const grupos = agrupar(filas, "receta");
  for (const [nombre, comps] of grupos) {
    if (nombresReceta.has(nombre.toLowerCase())) { saltados++; continue; }
    const categoriaId = await ensureCategoria(comps[0].categoria ?? "", cats);
    if (!categoriaId) { errores.push(`Receta "${nombre}": falta categoría`); continue; }
    const tamanoId = comps[0].tamano ? await ensureTamano(comps[0].tamano, tams) : null;
    const componentes = await resolverComponentes(
      comps.map((c) => ({ tipo: c.tipo, componente: c.componente, cantidad: c.cantidad, rendimiento: c.rendimiento })),
      0, ingPorNombre, semiPorNombre, errores, true,
    );
    if (!componentes) { errores.push(`Receta "${nombre}" omitida por error en componentes`); continue; }

    const cat = await prisma.categoria.findUniqueOrThrow({ where: { id: categoriaId }, select: { abreviatura: true, nombre: true } });
    let abrevTam = "";
    if (tamanoId) {
      const t = await prisma.tamano.findUniqueOrThrow({ where: { id: tamanoId }, select: { abreviatura: true, nombre: true } });
      abrevTam = (t.abreviatura?.trim()?.toUpperCase()) || abreviar(t.nombre);
    }
    const prefijo = prefijoReceta((cat.abreviatura?.trim()?.toUpperCase()) || abreviar(cat.nombre), abrevTam);
    const sku = `${prefijo}${siguienteNumero(skus, prefijo)}`;
    await prisma.receta.create({ data: { sku, nombre, categoriaId, tamanoId, componentes: { create: componentes } } });
    skus.push(sku);
    nombresReceta.add(nombre.toLowerCase());
    creados++;
  }
  return { creados, saltados, errores };
}
