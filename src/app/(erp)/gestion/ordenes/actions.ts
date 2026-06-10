"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Decimal } from "@/lib/erp/money";
import { requireCan } from "@/lib/erp/session.server";

export interface OrdenState {
  ok?: boolean;
  error?: string;
  ordenId?: string;
}

export async function crearOrden(_prev: OrdenState, formData: FormData): Promise<OrdenState> {
  const user = await requireCan("GESTION", "write");

  const clienteId = String(formData.get("clienteId") ?? "");
  const tiendaId = String(formData.get("tiendaId") ?? "");
  if (!clienteId || !tiendaId) return { error: "Elige cliente y tienda." };

  const tipos = formData.getAll("comp_tipo").map(String);
  const refIds = formData.getAll("comp_refId").map(String);
  const qtys = formData.getAll("comp_qty").map(String);
  const precios = formData.getAll("comp_precio").map(String);

  const [recetas, productos] = await Promise.all([
    prisma.receta.findMany({ select: { id: true, sku: true, nombre: true } }),
    prisma.producto.findMany({ select: { id: true, codigo: true, descripcion: true } }),
  ]);
  const recetaMap = new Map(recetas.map((r) => [r.id, r]));
  const productoMap = new Map(productos.map((p) => [p.id, p]));

  const lineas: { codigo: string; articulo: string; qty: string; precioUnit: string; subtotal: string }[] = [];
  let total = new Decimal(0);
  for (let k = 0; k < refIds.length; k++) {
    if (!refIds[k]) continue;
    const qty = qtys[k];
    const precio = precios[k];
    if (Number.isNaN(Number(qty)) || Number(qty) <= 0) return { error: "Cantidad inválida." };
    if (Number.isNaN(Number(precio)) || Number(precio) < 0) return { error: "Precio inválido." };
    let codigo: string;
    let articulo: string;
    if (tipos[k] === "producto") {
      const p = productoMap.get(refIds[k]);
      if (!p) return { error: "Producto no encontrado." };
      codigo = p.codigo;
      articulo = p.descripcion;
    } else {
      const r = recetaMap.get(refIds[k]);
      if (!r) return { error: "Receta no encontrada." };
      codigo = r.sku;
      articulo = r.nombre;
    }
    const subtotal = new Decimal(qty).mul(precio).toDecimalPlaces(2);
    total = total.plus(subtotal);
    lineas.push({ codigo, articulo, qty, precioUnit: precio, subtotal: subtotal.toString() });
  }
  if (!lineas.length) return { error: "Agrega al menos un renglón." };

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  const fecha = new Date();
  const fechaPagoEstimada =
    cliente?.diasPago != null ? new Date(fecha.getTime() + cliente.diasPago * 86400000) : null;

  const n = await prisma.ordenVenta.count();
  const folio = `OV-${String(n + 1).padStart(5, "0")}`;

  const orden = await prisma.ordenVenta.create({
    data: {
      folio,
      clienteId,
      tiendaId,
      usuarioId: user.id,
      totalPedido: total,
      fechaPagoEstimada,
      lineas: { create: lineas },
    },
  });
  revalidatePath("/gestion/ordenes");
  return { ok: true, ordenId: orden.id };
}

export async function marcarEntregada(formData: FormData): Promise<void> {
  await requireCan("GESTION", "write");
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.ordenVenta.update({ where: { id }, data: { estadoEntrega: "ENTREGADO", fechaEntrega: new Date() } });
  revalidatePath(`/gestion/ordenes/${id}`);
  revalidatePath("/gestion/ordenes");
}

export async function marcarFacturada(formData: FormData): Promise<void> {
  await requireCan("GESTION", "write");
  const id = String(formData.get("id") ?? "");
  const folioFactura = String(formData.get("folioFactura") ?? "") || null;
  if (id) await prisma.ordenVenta.update({ where: { id }, data: { estadoFactura: "FACTURADA", fechaFacturacion: new Date(), folioFactura } });
  revalidatePath(`/gestion/ordenes/${id}`);
  revalidatePath("/gestion/ordenes");
}

export async function marcarCobrada(formData: FormData): Promise<void> {
  await requireCan("GESTION", "write");
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.ordenVenta.update({ where: { id }, data: { estadoCobro: "PAGADO", fechaPago: new Date() } });
  revalidatePath(`/gestion/ordenes/${id}`);
  revalidatePath("/gestion/ordenes");
}
