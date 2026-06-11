"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { abreviar } from "@/lib/erp/codigos";
import type { CatalogState } from "@/components/erp/catalog-form";

const guard = () => requireCan("GESTION", "configure");
const txt = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

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
export async function actualizarMedioPrincipal(fd: FormData): Promise<void> {
  await guard();
  const id = txt(fd, "id");
  if (id) await prisma.canal.update({ where: { id }, data: { medioPagoPrincipalId: txt(fd, "medioPagoPrincipalId") || null } });
  revalidatePath("/configuracion/canales");
}
export async function guardarComision(fd: FormData): Promise<void> {
  await guard();
  const canalId = txt(fd, "canalId");
  const medioPagoId = txt(fd, "medioPagoId");
  const valor = txt(fd, "comisionPct");
  const n = Number(valor);
  if (!canalId || !medioPagoId || Number.isNaN(n) || n < 0 || n > 100) return;
  await prisma.comision.upsert({
    where: { canalId_medioPagoId: { canalId, medioPagoId } },
    update: { comisionPct: valor },
    create: { canalId, medioPagoId, comisionPct: valor },
  });
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
