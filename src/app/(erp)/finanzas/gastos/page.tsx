import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { can } from "@/lib/erp/rbac";
import { formatMXN } from "@/lib/erp/money";
import { GastoForm } from "./gasto-form";

export default async function GastosPage() {
  const user = await requireCan("FINANZAS", "read");
  const puede = can(user, "FINANZAS", "write");

  const [categorias, tiendas, gastos] = await Promise.all([
    prisma.categoriaGasto.findMany({ orderBy: { nombre: "asc" } }),
    prisma.tienda.findMany({ where: { activo: true, ...(user.esAdmin ? {} : { id: { in: [...user.tiendas] } }) }, orderBy: { codigo: "asc" } }),
    prisma.gasto.findMany({ orderBy: { fecha: "desc" }, take: 50, include: { categoriaGasto: true } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Gastos</h1>
        <p className="mt-1 text-sm text-neutral-500">Captura de gastos por categoría; IVA e ISR se calculan según la categoría.</p>
      </div>

      {puede && (
        <GastoForm
          categorias={categorias.map((c) => ({ id: c.id, nombre: c.nombre }))}
          tiendas={tiendas.map((t) => ({ id: t.id, codigo: t.codigo }))}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Fecha</th>
              <th className="px-4 py-2 font-medium">Categoría</th>
              <th className="px-4 py-2 font-medium">Descripción</th>
              <th className="px-4 py-2 font-medium text-right">Monto</th>
              <th className="px-4 py-2 font-medium text-right">IVA</th>
            </tr>
          </thead>
          <tbody>
            {gastos.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-400">Sin gastos.</td></tr>
            )}
            {gastos.map((g) => (
              <tr key={g.id} className="border-t border-neutral-100">
                <td className="px-4 py-2 text-neutral-500">{g.fecha.toISOString().slice(0, 10)}</td>
                <td className="px-4 py-2 text-neutral-800">{g.categoriaGasto.nombre}</td>
                <td className="px-4 py-2 text-neutral-800">{g.descripcion}</td>
                <td className="px-4 py-2 text-right text-neutral-800">{formatMXN(g.monto.toString())}</td>
                <td className="px-4 py-2 text-right text-neutral-500">{formatMXN(g.iva.toString())}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
