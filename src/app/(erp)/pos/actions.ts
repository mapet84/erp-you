"use server";

import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { calcularLineaVenta, agregarTicket, type LineaVenta } from "@/lib/erp/pos-line";
import { datosPOSPorReceta } from "@/lib/erp/costeo.server";
import { aplicarSalidaTx, aplicarDevolucionTx } from "@/lib/erp/inventario.server";
import { Decimal } from "@/lib/erp/money";

export interface VentaInput {
  tiendaId: string;
  canalId: string;
  medioPagoId?: string;
  modo: "VENTA" | "DEVOLUCION";
  lineas: { tipo: "receta" | "producto"; id: string; qty: number }[];
}

export interface TicketResumen {
  folio: string;
  fecha: string;
  canal: string;
  modo: string;
  lineas: { articulo: string; qty: string; precioUnit: string; totalVenta: string }[];
  subtotalSinIva: string;
  iva: string;
  comisionMonto: string;
  total: string;
}

export interface VentaResult {
  ok?: boolean;
  error?: string;
  ticket?: TicketResumen;
}

export async function registrarVenta(input: VentaInput): Promise<VentaResult> {
  const { tiendaId, canalId, medioPagoId, modo, lineas } = input;
  const user = await requireCan("POS", "write", tiendaId);
  if (!tiendaId || !canalId) return { error: "Falta tienda o canal." };
  if (!lineas?.length) return { error: "El carrito está vacío." };

  let comisionPct = new Decimal(0);
  if (medioPagoId) {
    const c = await prisma.comision.findUnique({ where: { canalId_medioPagoId: { canalId, medioPagoId } } });
    if (c) comisionPct = c.comisionPct;
  }
  const [canal, preciosReceta, preciosProducto, productos, recetas, datosReceta, inventario] = await Promise.all([
    prisma.canal.findUnique({ where: { id: canalId } }),
    prisma.precioReceta.findMany({ where: { canalId } }),
    prisma.productoPrecio.findMany({ where: { canalId } }),
    prisma.producto.findMany({ select: { id: true, codigo: true, descripcion: true } }),
    prisma.receta.findMany({ select: { id: true, sku: true, nombre: true } }),
    datosPOSPorReceta(tiendaId),
    prisma.inventario.findMany({ where: { tiendaId }, select: { codigo: true, cpm: true } }),
  ]);
  const precioReceta = new Map(preciosReceta.map((p) => [p.recetaId, p.precio]));
  const precioProducto = new Map(preciosProducto.map((p) => [p.productoId, p.precio]));
  const productoMap = new Map(productos.map((p) => [p.id, p]));
  const recetaMap = new Map(recetas.map((r) => [r.id, r]));
  const cpmCodigo = new Map(inventario.map((i) => [i.codigo, i.cpm]));
  const signo = modo === "DEVOLUCION" ? -1 : 1;

  type Resuelta = {
    codigo: string;
    articulo: string;
    qtyAbs: Decimal;
    qty: Decimal;
    precioUnit: Decimal;
    cpmUnit: Decimal;
    calc: LineaVenta;
    explosion: { codigo: string; nombre: string; qtyPorUnidad: Decimal }[] | null;
  };
  const resueltas: Resuelta[] = [];
  for (const ln of lineas) {
    const qtyAbs = new Decimal(ln.qty);
    if (qtyAbs.lte(0)) continue;
    const qty = qtyAbs.mul(signo);
    if (ln.tipo === "receta") {
      const r = recetaMap.get(ln.id);
      if (!r) return { error: "Receta no encontrada." };
      const precio = precioReceta.get(ln.id);
      if (!precio) return { error: `Sin precio para "${r.nombre}" en este canal.` };
      const d = datosReceta.get(ln.id);
      const cpmUnit = d?.cpmUnit ?? new Decimal(0);
      resueltas.push({
        codigo: r.sku,
        articulo: r.nombre,
        qtyAbs,
        qty,
        precioUnit: precio,
        cpmUnit,
        calc: calcularLineaVenta({ precioUnit: precio, qty, comisionPct, costoUnitario: cpmUnit }),
        explosion: (d?.explosion ?? []).map((e) => ({ codigo: e.codigo, nombre: e.nombre, qtyPorUnidad: e.qty })),
      });
    } else {
      const p = productoMap.get(ln.id);
      if (!p) return { error: "Producto no encontrado." };
      const precio = precioProducto.get(ln.id);
      if (!precio) return { error: `Sin precio para "${p.descripcion}" en este canal.` };
      const cpmUnit = cpmCodigo.get(p.codigo) ?? new Decimal(0);
      resueltas.push({
        codigo: p.codigo,
        articulo: p.descripcion,
        qtyAbs,
        qty,
        precioUnit: precio,
        cpmUnit,
        calc: calcularLineaVenta({ precioUnit: precio, qty, comisionPct, costoUnitario: cpmUnit }),
        explosion: null,
      });
    }
  }
  if (!resueltas.length) return { error: "El carrito está vacío." };
  const tot = agregarTicket(resueltas.map((r) => r.calc));
  const fecha = new Date();

  // Reintenta si dos cajas chocan en el folio (índice único).
  for (let intento = 0; intento < 3; intento++) {
    try {
      const ticket = await prisma.$transaction(async (tx) => {
        const n = await tx.ticketPOS.count();
        const folio = `V-${String(n + 1 + intento).padStart(5, "0")}`;
        const t = await tx.ticketPOS.create({
          data: {
            folio,
            folioTicket: folio,
            tiendaId,
            usuarioId: user.id,
            canalId,
            medioPagoId: medioPagoId ?? null,
            tipo: modo,
            total: tot.totalVenta,
            subtotalSinIva: tot.subtotalSinIva,
            iva: tot.iva,
            comisionMonto: tot.comisionMonto,
            costo: tot.costo,
            utilidad: tot.utilidadMonto,
            fecha,
          },
        });
        for (const r of resueltas) {
          await tx.venta.create({
            data: {
              ticketId: t.id,
              tiendaId,
              fecha,
              tipo: modo,
              usuarioId: user.id,
              canalId,
              medioPagoId: medioPagoId ?? null,
              codigo: r.codigo,
              articulo: r.articulo,
              qty: r.qty,
              precioUnit: r.precioUnit,
              totalVenta: r.calc.totalVenta,
              subtotalSinIva: r.calc.subtotalSinIva,
              iva: r.calc.iva,
              comisionPct,
              comisionMonto: r.calc.comisionMonto,
              cpm: r.cpmUnit,
              costo: r.calc.costo,
              utilidadMonto: r.calc.utilidadMonto,
              utilidadPct: r.calc.utilidadPct,
            },
          });
          // Movimientos de inventario: receta → explota a ingredientes; producto → él mismo.
          const items = r.explosion
            ? r.explosion.map((e) => ({ codigo: e.codigo, nombre: e.nombre, qty: e.qtyPorUnidad.mul(r.qtyAbs) }))
            : [{ codigo: r.codigo, nombre: r.articulo, qty: r.qtyAbs }];
          for (const it of items) {
            const arg = { tiendaId, codigo: it.codigo, nombre: it.nombre, qty: it.qty.toString(), refTipo: "ticket", refId: t.id, fecha };
            if (modo === "DEVOLUCION") await aplicarDevolucionTx(tx, arg);
            else await aplicarSalidaTx(tx, { ...arg, tipoMovimiento: "VENTA" });
          }
        }
        return t;
      });

      return {
        ok: true,
        ticket: {
          folio: ticket.folio,
          fecha: fecha.toISOString(),
          canal: canal?.nombre ?? "",
          modo,
          lineas: resueltas.map((r) => ({
            articulo: r.articulo,
            qty: r.qtyAbs.toString(),
            precioUnit: r.precioUnit.toString(),
            totalVenta: r.calc.totalVenta.toString(),
          })),
          subtotalSinIva: tot.subtotalSinIva.toString(),
          iva: tot.iva.toString(),
          comisionMonto: tot.comisionMonto.toString(),
          total: tot.totalVenta.toString(),
        },
      };
    } catch (e) {
      const msg = (e as Error).message ?? "";
      if (intento < 2 && /Unique|folio/i.test(msg)) continue;
      return { error: "No se pudo registrar la venta. Intenta de nuevo." };
    }
  }
  return { error: "No se pudo asignar folio. Intenta de nuevo." };
}
