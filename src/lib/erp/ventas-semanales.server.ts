// Materializa el agregado VentaSemanal a partir de las líneas de Venta del POS.
// Es la base histórica del pronóstico (#11).

import { prisma } from "@/lib/db";
import { Decimal } from "./money";

/// Semana ISO 8601 (lunes como inicio) de una fecha.
export function semanaIso(d: Date): { anio: number; semana: number } {
  const fecha = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dia = (fecha.getUTCDay() + 6) % 7; // lunes = 0
  fecha.setUTCDate(fecha.getUTCDate() - dia + 3); // jueves de esa semana
  const primerJueves = new Date(Date.UTC(fecha.getUTCFullYear(), 0, 4));
  const diaPJ = (primerJueves.getUTCDay() + 6) % 7;
  primerJueves.setUTCDate(primerJueves.getUTCDate() - diaPJ + 3);
  const semana = 1 + Math.round((fecha.getTime() - primerJueves.getTime()) / (7 * 86400000));
  return { anio: fecha.getUTCFullYear(), semana };
}

/// Recalcula VentaSemanal desde cero a partir de todas las ventas (idempotente).
export async function materializarVentasSemanales(): Promise<number> {
  const ventas = await prisma.venta.findMany({
    select: {
      fecha: true, tiendaId: true, canalId: true, codigo: true, articulo: true,
      totalVenta: true, costo: true, utilidadMonto: true, qty: true, ticketId: true,
    },
  });

  type Agg = {
    anio: number; semana: number; tiendaId: string; canalId: string; codigo: string; articulo: string;
    ventas: Decimal; costo: Decimal; utilidad: Decimal; unidades: Decimal; tickets: Set<string>;
  };
  const map = new Map<string, Agg>();
  for (const v of ventas) {
    const { anio, semana } = semanaIso(v.fecha);
    const key = `${anio}|${semana}|${v.tiendaId}|${v.canalId}|${v.codigo}`;
    let a = map.get(key);
    if (!a) {
      a = { anio, semana, tiendaId: v.tiendaId, canalId: v.canalId, codigo: v.codigo, articulo: v.articulo, ventas: new Decimal(0), costo: new Decimal(0), utilidad: new Decimal(0), unidades: new Decimal(0), tickets: new Set() };
      map.set(key, a);
    }
    a.ventas = a.ventas.plus(v.totalVenta);
    a.costo = a.costo.plus(v.costo);
    a.utilidad = a.utilidad.plus(v.utilidadMonto);
    a.unidades = a.unidades.plus(v.qty);
    a.tickets.add(v.ticketId);
  }

  await prisma.$transaction([
    prisma.ventaSemanal.deleteMany({}),
    ...[...map.values()].map((a) =>
      prisma.ventaSemanal.create({
        data: {
          anio: a.anio, semana: a.semana, tiendaId: a.tiendaId, canalId: a.canalId,
          codigo: a.codigo, articulo: a.articulo, ventas: a.ventas, costo: a.costo,
          utilidad: a.utilidad, unidades: a.unidades, transacciones: a.tickets.size,
        },
      }),
    ),
  ]);
  return map.size;
}
