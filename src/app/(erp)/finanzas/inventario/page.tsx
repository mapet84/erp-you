import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { costosCPMPorReceta } from "@/lib/erp/costeo.server";
import { formatMXN } from "@/lib/erp/money";

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ tienda?: string }>;
}) {
  const user = await requireCan("FINANZAS", "read");
  const { tienda: tiendaParam } = await searchParams;

  const tiendas = await prisma.tienda.findMany({
    where: { activo: true, ...(user.esAdmin ? {} : { id: { in: [...user.tiendas] } }) },
    orderBy: { codigo: "asc" },
  });
  const tiendaId = tiendaParam && tiendas.some((t) => t.id === tiendaParam) ? tiendaParam : tiendas[0]?.id;

  if (!tiendaId) {
    return <p className="text-sm text-neutral-400">No tienes tiendas asignadas.</p>;
  }

  const [inventario, recetas, cpmReceta] = await Promise.all([
    prisma.inventario.findMany({ where: { tiendaId }, orderBy: { codigo: "asc" } }),
    prisma.receta.findMany({ orderBy: { sku: "asc" }, select: { id: true, sku: true, nombre: true } }),
    costosCPMPorReceta(tiendaId),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Inventario</h1>
        <p className="mt-1 text-sm text-neutral-500">Existencias y costo promedio móvil (CPM) por tienda.</p>
      </div>

      {tiendas.length > 1 && (
        <div className="flex gap-2 text-sm">
          {tiendas.map((t) => (
            <Link
              key={t.id}
              href={`/finanzas/inventario?tienda=${t.id}`}
              className={`rounded-md border px-3 py-1.5 ${t.id === tiendaId ? "border-neutral-800 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"}`}
            >
              {t.codigo}
            </Link>
          ))}
        </div>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-800">Existencias</h2>
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Código</th>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium text-right">Stock</th>
                <th className="px-4 py-2 font-medium text-right">CPM</th>
                <th className="px-4 py-2 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {inventario.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-400">Sin existencias. Registra compras.</td></tr>
              )}
              {inventario.map((i) => (
                <tr key={i.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 font-mono text-neutral-800">{i.codigo}</td>
                  <td className="px-4 py-2 text-neutral-800">{i.nombre}</td>
                  <td className={`px-4 py-2 text-right ${i.stock.lt(0) ? "font-medium text-red-600" : "text-neutral-700"}`}>{i.stock.toString()}</td>
                  <td className="px-4 py-2 text-right text-neutral-700">{formatMXN(i.cpm.toString())}</td>
                  <td className="px-4 py-2 text-right text-neutral-700">{formatMXN(i.valorTotal.toString())}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-800">Costo real (CPM) de recetas en esta tienda</h2>
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">SKU</th>
                <th className="px-4 py-2 font-medium">Receta</th>
                <th className="px-4 py-2 font-medium text-right">Costo CPM</th>
              </tr>
            </thead>
            <tbody>
              {recetas.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-neutral-400">Sin recetas.</td></tr>
              )}
              {recetas.map((r) => (
                <tr key={r.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 font-mono text-neutral-800">{r.sku}</td>
                  <td className="px-4 py-2 text-neutral-800">{r.nombre}</td>
                  <td className="px-4 py-2 text-right text-neutral-700">{formatMXN(cpmReceta.get(r.id) ?? "0")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
