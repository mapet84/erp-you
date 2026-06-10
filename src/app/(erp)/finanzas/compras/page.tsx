import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { can } from "@/lib/erp/rbac";
import { formatMXN } from "@/lib/erp/money";
import { CompraForm } from "./compra-form";
import { marcarPagada } from "./actions";

export default async function ComprasPage() {
  const user = await requireCan("FINANZAS", "read");
  const puedeRegistrar = can(user, "FINANZAS", "write");

  const tiendaFiltro = user.esAdmin ? {} : { id: { in: [...user.tiendas] } };
  const [tiendas, ingredientes, productos, medios, compras] = await Promise.all([
    prisma.tienda.findMany({ where: { activo: true, ...tiendaFiltro }, orderBy: { codigo: "asc" } }),
    prisma.ingrediente.findMany({ orderBy: { codigo: "asc" } }),
    prisma.producto.findMany({ orderBy: { codigo: "asc" } }),
    prisma.medioCompra.findMany({ orderBy: { nombre: "asc" } }),
    prisma.compra.findMany({
      where: user.esAdmin ? {} : { tiendaId: { in: [...user.tiendas] } },
      orderBy: { fechaCompra: "desc" },
      take: 50,
      include: { tienda: true, medioCompra: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Compras</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Cada compra recalcula el CPM (promedio móvil) de la tienda y genera una cuenta por pagar.
        </p>
      </div>

      {puedeRegistrar && (
        <CompraForm
          tiendas={tiendas.map((t) => ({ id: t.id, codigo: t.codigo, nombre: t.nombre }))}
          ingredientes={ingredientes.map((i) => ({ id: i.id, codigo: i.codigo, nombre: i.nombre }))}
          productos={productos.map((p) => ({ id: p.id, codigo: p.codigo, nombre: p.descripcion }))}
          medios={medios.map((m) => ({ id: m.id, nombre: m.nombre }))}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Fecha</th>
              <th className="px-4 py-2 font-medium">Tienda</th>
              <th className="px-4 py-2 font-medium">Artículo</th>
              <th className="px-4 py-2 font-medium text-right">Cant.</th>
              <th className="px-4 py-2 font-medium text-right">Monto</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {compras.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-neutral-400">Sin compras registradas.</td></tr>
            )}
            {compras.map((c) => (
              <tr key={c.id} className="border-t border-neutral-100">
                <td className="px-4 py-2 text-neutral-500">{c.fechaCompra.toISOString().slice(0, 10)}</td>
                <td className="px-4 py-2 text-neutral-500">{c.tienda.codigo}</td>
                <td className="px-4 py-2 text-neutral-800">{c.descripcion}</td>
                <td className="px-4 py-2 text-right text-neutral-500">{c.cantidad.toString()}</td>
                <td className="px-4 py-2 text-right text-neutral-800">{formatMXN(c.monto.toString())}</td>
                <td className="px-4 py-2">
                  <span className={c.estado === "PAGADA" ? "rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700" : "rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700"}>
                    {c.estado}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  {puedeRegistrar && c.estado === "PENDIENTE" && (
                    <form action={marcarPagada}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="text-xs text-neutral-500 hover:text-neutral-900">Marcar pagada</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
