// Endpoint del pronóstico semanal automático (Vercel Cron, rebanada #12).
// Se autentica con `CRON_SECRET` por header `Authorization: Bearer <secret>`
// (Vercel lo envía automáticamente si la variable está configurada). No pasa por
// el proxy del ERP (las rutas /api quedan fuera del matcher).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { materializarVentasSemanales, semanaIso } from "@/lib/erp/ventas-semanales.server";
import { generarPronostico } from "@/lib/erp/forecast.server";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await materializarVentasSemanales();
  const tiendas = await prisma.tienda.findMany({ where: { activo: true }, select: { id: true } });
  const ids: string[] = [];
  for (const t of tiendas) {
    ids.push(
      await generarPronostico(t.id, {
        metodo: "lineal",
        semanasHistoria: 12,
        horizonteSemanas: 4,
        usaTendencia: true,
        usaEstacional: false,
        crecimiento: 1,
      }),
    );
  }

  const { anio, semana } = semanaIso(new Date());
  await prisma.pronStatus.upsert({
    where: { anio_semana: { anio, semana } },
    update: { ranAt: new Date() },
    create: { anio, semana },
  });

  return NextResponse.json({ ok: true, tiendas: tiendas.length, pronosticos: ids.length, semana: `${anio}-W${semana}` });
}
