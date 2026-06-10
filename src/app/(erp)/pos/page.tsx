import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { PosClient } from "./pos-client";

export default async function PosPage() {
  const user = await requireCan("POS", "read");

  const [tiendasDb, canales, medios, recetas, productos] = await Promise.all([
    prisma.tienda.findMany({
      where: { activo: true, ...(user.esAdmin ? {} : { id: { in: [...user.tiendas] } }) },
      orderBy: { codigo: "asc" },
    }),
    prisma.canal.findMany({ orderBy: { nombre: "asc" } }),
    prisma.medioPago.findMany({ orderBy: { nombre: "asc" } }),
    prisma.receta.findMany({ include: { categoria: true, precios: true } }),
    prisma.producto.findMany({ include: { categoria: true, precios: true } }),
  ]);

  const items = [
    ...recetas.map((r) => ({
      tipo: "receta" as const,
      id: r.id,
      codigo: r.sku,
      nombre: r.nombre,
      categoria: r.categoria.nombre,
      precios: Object.fromEntries(r.precios.map((p) => [p.canalId, p.precio.toString()])),
    })),
    ...productos.map((p) => ({
      tipo: "producto" as const,
      id: p.id,
      codigo: p.codigo,
      nombre: p.descripcion,
      categoria: p.categoria.nombre,
      precios: Object.fromEntries(p.precios.map((pr) => [pr.canalId, pr.precio.toString()])),
    })),
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Punto de Venta</h1>
        <Link href="/pos/historial" className="text-sm text-neutral-500 hover:text-neutral-800">Historial →</Link>
      </div>
      <PosClient
        tiendas={tiendasDb.map((t) => ({ id: t.id, codigo: t.codigo, nombre: t.nombre }))}
        canales={canales.map((c) => ({ id: c.id, nombre: c.nombre }))}
        medios={medios.map((m) => ({ id: m.id, nombre: m.nombre }))}
        items={items}
      />
    </div>
  );
}
