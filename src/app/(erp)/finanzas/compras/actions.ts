"use server";

import { revalidatePath } from "next/cache";
import type { TipoItem } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { registrarCompra } from "@/lib/erp/inventario.server";

export interface CompraState {
  ok?: boolean;
  error?: string;
}

export async function crearCompra(_prev: CompraState, formData: FormData): Promise<CompraState> {
  const tiendaId = String(formData.get("tiendaId") ?? "");
  const tipo = (String(formData.get("tipo") ?? "INGREDIENTE") as TipoItem);
  const itemId = String(formData.get("itemId") ?? "");
  const cantidad = String(formData.get("cantidad") ?? "");
  const costoUnitario = String(formData.get("costoUnitario") ?? "");
  const medioCompraId = String(formData.get("medioCompraId") ?? "") || null;

  await requireCan("FINANZAS", "write", tiendaId);

  if (!tiendaId || !itemId) return { error: "Elige tienda y artículo." };
  if (Number.isNaN(Number(cantidad)) || Number(cantidad) <= 0) return { error: "Cantidad inválida." };
  if (Number.isNaN(Number(costoUnitario)) || Number(costoUnitario) < 0) return { error: "Costo inválido." };

  let codigo: string;
  let nombre: string;
  if (tipo === "PRODUCTO") {
    const p = await prisma.producto.findUnique({ where: { id: itemId } });
    if (!p) return { error: "Producto no encontrado." };
    codigo = p.codigo;
    nombre = p.descripcion;
  } else {
    const i = await prisma.ingrediente.findUnique({ where: { id: itemId } });
    if (!i) return { error: "Ingrediente no encontrado." };
    codigo = i.codigo;
    nombre = i.nombre;
  }

  await registrarCompra({ tiendaId, tipo, codigo, nombre, cantidad, costoUnitario, medioCompraId });
  revalidatePath("/finanzas/compras");
  revalidatePath("/finanzas/inventario");
  return { ok: true };
}

/// Marca una compra (cuenta por pagar) como pagada.
export async function marcarPagada(formData: FormData): Promise<void> {
  await requireCan("FINANZAS", "write");
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.compra.update({ where: { id }, data: { estado: "PAGADA", fechaPago: new Date() } });
  revalidatePath("/finanzas/compras");
}
