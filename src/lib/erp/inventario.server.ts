// Operaciones de inventario contra la BD, atómicas ($transaction). Aplican el
// módulo puro `inventario` y dejan el asiento en `Movimiento`.

import type { Prisma, TipoItem, TipoMovimiento } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recostearEntrada, aplicarSalida, aplicarDevolucion, type ResultadoMovimiento } from "./inventario";

/// Registra una compra: recalcula CPM (MAP), sube stock, deja Movimiento(COMPRA)
/// y crea la cuenta por pagar. Todo en una transacción.
export async function registrarCompra(input: {
  tiendaId: string;
  tipo: TipoItem;
  codigo: string;
  nombre: string;
  cantidad: string;
  costoUnitario: string;
  medioCompraId?: string | null;
  fecha?: Date;
}) {
  const fecha = input.fecha ?? new Date();
  return prisma.$transaction(async (tx) => {
    const inv = await tx.inventario.findUnique({
      where: { tiendaId_codigo: { tiendaId: input.tiendaId, codigo: input.codigo } },
    });
    const res = recostearEntrada(
      { stock: inv?.stock ?? 0, cpm: inv?.cpm ?? 0 },
      input.cantidad,
      input.costoUnitario,
    );
    await tx.inventario.upsert({
      where: { tiendaId_codigo: { tiendaId: input.tiendaId, codigo: input.codigo } },
      update: { stock: res.stock, cpm: res.cpm, valorTotal: res.valorTotal, nombre: input.nombre, tipo: input.tipo },
      create: {
        tiendaId: input.tiendaId,
        codigo: input.codigo,
        nombre: input.nombre,
        tipo: input.tipo,
        stock: res.stock,
        cpm: res.cpm,
        valorTotal: res.valorTotal,
      },
    });
    await tx.movimiento.create({
      data: {
        tiendaId: input.tiendaId,
        codigo: input.codigo,
        nombre: input.nombre,
        tipoMovimiento: "COMPRA",
        qty: res.qty,
        cpm: res.cpm,
        costoTotal: res.costoMovimiento,
        refTipo: "compra",
        fecha,
      },
    });
    return tx.compra.create({
      data: {
        tiendaId: input.tiendaId,
        codigo: input.codigo,
        descripcion: input.nombre,
        cantidad: input.cantidad,
        costoUnitario: input.costoUnitario,
        monto: res.costoMovimiento,
        medioCompraId: input.medioCompraId ?? null,
        estado: "PENDIENTE",
        fechaCompra: fecha,
      },
    });
  });
}

/// Aplica una salida de inventario (venta/merma) al CPM vigente dentro de una
/// transacción existente. Devuelve el resultado del movimiento (para el COGS).
/// Lo usa el cierre de venta del POS (#7).
export async function aplicarSalidaTx(
  tx: Prisma.TransactionClient,
  input: {
    tiendaId: string;
    codigo: string;
    nombre: string;
    qty: string;
    tipoMovimiento: TipoMovimiento;
    refTipo?: string;
    refId?: string;
    fecha?: Date;
  },
): Promise<ResultadoMovimiento> {
  const inv = await tx.inventario.findUnique({
    where: { tiendaId_codigo: { tiendaId: input.tiendaId, codigo: input.codigo } },
  });
  const res = aplicarSalida({ stock: inv?.stock ?? 0, cpm: inv?.cpm ?? 0 }, input.qty);
  await tx.inventario.upsert({
    where: { tiendaId_codigo: { tiendaId: input.tiendaId, codigo: input.codigo } },
    update: { stock: res.stock, valorTotal: res.valorTotal },
    create: {
      tiendaId: input.tiendaId,
      codigo: input.codigo,
      nombre: input.nombre,
      tipo: "INGREDIENTE",
      stock: res.stock,
      cpm: res.cpm,
      valorTotal: res.valorTotal,
    },
  });
  await tx.movimiento.create({
    data: {
      tiendaId: input.tiendaId,
      codigo: input.codigo,
      nombre: input.nombre,
      tipoMovimiento: input.tipoMovimiento,
      qty: res.qty,
      cpm: res.cpm,
      costoTotal: res.costoMovimiento,
      refTipo: input.refTipo,
      refId: input.refId,
      fecha: input.fecha ?? new Date(),
    },
  });
  return res;
}

/// Reingreso de inventario (devolución) al CPM vigente, dentro de una transacción.
export async function aplicarDevolucionTx(
  tx: Prisma.TransactionClient,
  input: {
    tiendaId: string;
    codigo: string;
    nombre: string;
    qty: string;
    refTipo?: string;
    refId?: string;
    fecha?: Date;
  },
): Promise<ResultadoMovimiento> {
  const inv = await tx.inventario.findUnique({
    where: { tiendaId_codigo: { tiendaId: input.tiendaId, codigo: input.codigo } },
  });
  const res = aplicarDevolucion({ stock: inv?.stock ?? 0, cpm: inv?.cpm ?? 0 }, input.qty);
  await tx.inventario.upsert({
    where: { tiendaId_codigo: { tiendaId: input.tiendaId, codigo: input.codigo } },
    update: { stock: res.stock, valorTotal: res.valorTotal },
    create: {
      tiendaId: input.tiendaId,
      codigo: input.codigo,
      nombre: input.nombre,
      tipo: "INGREDIENTE",
      stock: res.stock,
      cpm: res.cpm,
      valorTotal: res.valorTotal,
    },
  });
  await tx.movimiento.create({
    data: {
      tiendaId: input.tiendaId,
      codigo: input.codigo,
      nombre: input.nombre,
      tipoMovimiento: "DEVOLUCION",
      qty: res.qty,
      cpm: res.cpm,
      costoTotal: res.costoMovimiento,
      refTipo: input.refTipo,
      refId: input.refId,
      fecha: input.fecha ?? new Date(),
    },
  });
  return res;
}
