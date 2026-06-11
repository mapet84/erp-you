"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCan, requireAdmin } from "@/lib/erp/session.server";
import { abreviar } from "@/lib/erp/codigos";
import type { CatalogState } from "@/components/erp/catalog-form";

const guard = () => requireCan("GESTION", "configure");
const txt = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/// Borra un registro (solo admin). FK-safe: si está en uso, no truena (no borra).
async function borrar(modelo: { delete: (a: { where: { id: string } }) => Promise<unknown> }, fd: FormData, ruta: string) {
  await requireAdmin();
  const id = txt(fd, "id");
  if (id) {
    try {
      await modelo.delete({ where: { id } });
    } catch {
      /* referenciado por otros datos: no se elimina */
    }
  }
  revalidatePath(ruta);
}

export async function borrarCategoria(fd: FormData) { await borrar(prisma.categoria, fd, "/configuracion/categorias"); }
export async function borrarTamano(fd: FormData) { await borrar(prisma.tamano, fd, "/configuracion/tamanos"); }
export async function borrarUnidad(fd: FormData) { await borrar(prisma.unidad, fd, "/configuracion/unidades"); }
export async function borrarCanal(fd: FormData) { await borrar(prisma.canal, fd, "/configuracion/canales"); }
export async function borrarMedioPago(fd: FormData) { await borrar(prisma.medioPago, fd, "/configuracion/medios-pago"); }
export async function borrarMedioCompra(fd: FormData) { await borrar(prisma.medioCompra, fd, "/configuracion/medios-compra"); }
export async function borrarTienda(fd: FormData) { await borrar(prisma.tienda, fd, "/configuracion/tiendas"); }

// ── Categorías ───────────────────────────────────────────────────────────────
export async function crearCategoria(_p: CatalogState, fd: FormData): Promise<CatalogState> {
  await guard();
  const nombre = txt(fd, "nombre");
  if (!nombre) return { error: "Nombre requerido." };
  const abreviatura = txt(fd, "abreviatura").toUpperCase() || abreviar(nombre);
  try {
    await prisma.categoria.create({ data: { nombre, abreviatura } });
  } catch {
    return { error: "Ya existe esa categoría." };
  }
  revalidatePath("/configuracion/categorias");
  return { ok: true };
}
export async function actualizarAbrevCategoria(fd: FormData): Promise<void> {
  await guard();
  const id = txt(fd, "id");
  if (id) await prisma.categoria.update({ where: { id }, data: { abreviatura: txt(fd, "abreviatura").toUpperCase() || null } });
  revalidatePath("/configuracion/categorias");
}

// ── Tamaños ──────────────────────────────────────────────────────────────────
export async function crearTamano(_p: CatalogState, fd: FormData): Promise<CatalogState> {
  await guard();
  const nombre = txt(fd, "nombre");
  if (!nombre) return { error: "Nombre requerido." };
  const abreviatura = txt(fd, "abreviatura").toUpperCase() || abreviar(nombre);
  try {
    await prisma.tamano.create({ data: { nombre, abreviatura } });
  } catch {
    return { error: "Ya existe ese tamaño." };
  }
  revalidatePath("/configuracion/tamanos");
  return { ok: true };
}
export async function actualizarAbrevTamano(fd: FormData): Promise<void> {
  await guard();
  const id = txt(fd, "id");
  if (id) await prisma.tamano.update({ where: { id }, data: { abreviatura: txt(fd, "abreviatura").toUpperCase() || null } });
  revalidatePath("/configuracion/tamanos");
}

// ── Unidades + conversiones ──────────────────────────────────────────────────
export async function crearUnidad(_p: CatalogState, fd: FormData): Promise<CatalogState> {
  await guard();
  const codigo = txt(fd, "codigo").toUpperCase();
  const nombre = txt(fd, "nombre");
  if (!codigo || !nombre) return { error: "Código y nombre requeridos." };
  try {
    await prisma.unidad.create({ data: { codigo, nombre } });
  } catch {
    return { error: "Ya existe esa unidad." };
  }
  revalidatePath("/configuracion/unidades");
  return { ok: true };
}
export async function crearConversion(_p: CatalogState, fd: FormData): Promise<CatalogState> {
  await guard();
  const origenId = txt(fd, "origenId");
  const destinoId = txt(fd, "destinoId");
  const factor = txt(fd, "factor");
  if (!origenId || !destinoId) return { error: "Elige origen y destino." };
  if (origenId === destinoId) return { error: "Origen y destino deben diferir." };
  if (Number.isNaN(Number(factor)) || Number(factor) <= 0) return { error: "Factor inválido." };
  await prisma.conversionUnidad.upsert({
    where: { origenId_destinoId: { origenId, destinoId } },
    update: { factor },
    create: { origenId, destinoId, factor },
  });
  revalidatePath("/configuracion/unidades");
  return { ok: true };
}
export async function borrarConversion(fd: FormData): Promise<void> {
  await guard();
  const id = txt(fd, "id");
  if (id) await prisma.conversionUnidad.delete({ where: { id } });
  revalidatePath("/configuracion/unidades");
}

// ── Canales (con medio principal) ────────────────────────────────────────────
export async function crearCanal(_p: CatalogState, fd: FormData): Promise<CatalogState> {
  await guard();
  const nombre = txt(fd, "nombre");
  if (!nombre) return { error: "Nombre requerido." };
  const medioPagoPrincipalId = txt(fd, "medioPagoPrincipalId") || null;
  try {
    await prisma.canal.create({ data: { nombre, medioPagoPrincipalId } });
  } catch {
    return { error: "Ya existe ese canal." };
  }
  revalidatePath("/configuracion/canales");
  return { ok: true };
}
/// Guarda el medio principal de TODOS los canales en un envío. Campo: `mp_<canalId>`.
export async function guardarMediosPrincipales(fd: FormData): Promise<void> {
  await guard();
  const canales = await prisma.canal.findMany({ select: { id: true } });
  await prisma.$transaction(
    canales.map((c) => prisma.canal.update({ where: { id: c.id }, data: { medioPagoPrincipalId: txt(fd, `mp_${c.id}`) || null } })),
  );
  revalidatePath("/configuracion/canales");
}

/// Guarda TODAS las comisiones en un envío. Campo: `c_<canalId>_<medioPagoId>`.
export async function guardarComisiones(fd: FormData): Promise<void> {
  await guard();
  const [canales, medios] = await Promise.all([
    prisma.canal.findMany({ select: { id: true } }),
    prisma.medioPago.findMany({ select: { id: true } }),
  ]);
  const ops = [];
  for (const ca of canales) {
    for (const m of medios) {
      const raw = txt(fd, `c_${ca.id}_${m.id}`).replace(",", ".");
      if (raw === "") { ops.push(prisma.comision.deleteMany({ where: { canalId: ca.id, medioPagoId: m.id } })); continue; }
      const n = Number(raw);
      if (Number.isNaN(n) || n < 0 || n > 100) continue;
      ops.push(prisma.comision.upsert({ where: { canalId_medioPagoId: { canalId: ca.id, medioPagoId: m.id } }, update: { comisionPct: raw }, create: { canalId: ca.id, medioPagoId: m.id, comisionPct: raw } }));
    }
  }
  await prisma.$transaction(ops);
  revalidatePath("/configuracion/canales");
}

// ── Medios de pago ───────────────────────────────────────────────────────────
export async function crearMedioPago(_p: CatalogState, fd: FormData): Promise<CatalogState> {
  await guard();
  const nombre = txt(fd, "nombre");
  if (!nombre) return { error: "Nombre requerido." };
  try {
    await prisma.medioPago.create({ data: { nombre } });
  } catch {
    return { error: "Ya existe ese medio de pago." };
  }
  revalidatePath("/configuracion/medios-pago");
  return { ok: true };
}

// ── Medios de compra ─────────────────────────────────────────────────────────
export async function crearMedioCompra(_p: CatalogState, fd: FormData): Promise<CatalogState> {
  await guard();
  const nombre = txt(fd, "nombre");
  if (!nombre) return { error: "Nombre requerido." };
  const dias = Number(txt(fd, "diasCredito") || "0");
  try {
    await prisma.medioCompra.create({ data: { nombre, diasCredito: Number.isInteger(dias) ? dias : 0 } });
  } catch {
    return { error: "Ya existe ese medio de compra." };
  }
  revalidatePath("/configuracion/medios-compra");
  return { ok: true };
}

// ── Motivos de ajuste ────────────────────────────────────────────────────────
export async function crearMotivo(_p: CatalogState, fd: FormData): Promise<CatalogState> {
  await guard();
  const nombre = txt(fd, "nombre");
  if (!nombre) return { error: "Nombre requerido." };
  try {
    await prisma.motivoAjuste.create({ data: { nombre } });
  } catch {
    return { error: "Ya existe ese motivo." };
  }
  revalidatePath("/configuracion/motivos");
  return { ok: true };
}
export async function borrarMotivo(fd: FormData): Promise<void> {
  await guard();
  const id = txt(fd, "id");
  if (id) await prisma.motivoAjuste.delete({ where: { id } });
  revalidatePath("/configuracion/motivos");
}
