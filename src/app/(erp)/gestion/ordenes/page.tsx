import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { can } from "@/lib/erp/rbac";
import { formatMXN } from "@/lib/erp/money";
import { OrdenForm } from "./orden-form";

const ESTADO_CLS: Record<string, string> = {
  PENDIENTE: "bg-amber-50 text-amber-700",
  ENTREGADO: "bg-green-50 text-green-700",
  PAGADO: "bg-green-50 text-green-700",
  FACTURADA: "bg-green-50 text-green-700",
  SIN_FACTURA: "bg-neutral-100 text-neutral-500",
  CANCELADO: "bg-red-50 text-red-600",
};
const chip = (e: string) => `rounded-full px-2 py-0.5 text-xs ${ESTADO_CLS[e] ?? "bg-neutral-100 text-neutral-500"}`;

export default async function OrdenesPage() {
  const user = await requireCan("GESTION", "read");
  const puedeRegistrar = can(user, "GESTION", "write");

  const [ordenes, clientes, tiendas, recetas, productos] = await Promise.all([
    prisma.ordenVenta.findMany({ orderBy: { fecha: "desc" }, take: 50, include: { cliente: true, tienda: true } }),
    prisma.cliente.findMany({ orderBy: { nombre: "asc" } }),
    prisma.tienda.findMany({ where: { activo: true }, orderBy: { codigo: "asc" } }),
    prisma.receta.findMany({ orderBy: { sku: "asc" }, select: { id: true, sku: true, nombre: true } }),
    prisma.producto.findMany({ orderBy: { codigo: "asc" }, select: { id: true, codigo: true, descripcion: true } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Órdenes de venta</h1>
        <p className="mt-1 text-sm text-neutral-500">Pedidos por entregar, con seguimiento de entrega, factura y cobro.</p>
      </div>

      {puedeRegistrar && (
        clientes.length === 0 ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">Primero captura un cliente.</p>
        ) : (
          <OrdenForm
            clientes={clientes.map((c) => ({ id: c.id, nombre: c.nombre }))}
            tiendas={tiendas.map((t) => ({ id: t.id, codigo: t.codigo }))}
            recetas={recetas.map((r) => ({ id: r.id, codigo: r.sku, nombre: r.nombre }))}
            productos={productos.map((p) => ({ id: p.id, codigo: p.codigo, nombre: p.descripcion }))}
          />
        )
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Folio</th>
              <th className="px-4 py-2 font-medium">Cliente</th>
              <th className="px-4 py-2 font-medium text-right">Total</th>
              <th className="px-4 py-2 font-medium">Entrega</th>
              <th className="px-4 py-2 font-medium">Factura</th>
              <th className="px-4 py-2 font-medium">Cobro</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {ordenes.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-neutral-400">Sin órdenes.</td></tr>
            )}
            {ordenes.map((o) => (
              <tr key={o.id} className="border-t border-neutral-100">
                <td className="px-4 py-2 font-mono text-neutral-800">{o.folio}</td>
                <td className="px-4 py-2 text-neutral-800">{o.cliente.nombre}</td>
                <td className="px-4 py-2 text-right text-neutral-700">{formatMXN(o.totalPedido.toString())}</td>
                <td className="px-4 py-2"><span className={chip(o.estadoEntrega)}>{o.estadoEntrega}</span></td>
                <td className="px-4 py-2"><span className={chip(o.estadoFactura)}>{o.estadoFactura}</span></td>
                <td className="px-4 py-2"><span className={chip(o.estadoCobro)}>{o.estadoCobro}</span></td>
                <td className="px-4 py-2 text-right"><Link href={`/gestion/ordenes/${o.id}`} className="text-xs font-medium text-neutral-600 hover:text-neutral-900">Ver</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
