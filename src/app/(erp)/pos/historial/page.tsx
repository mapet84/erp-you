import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { formatMXN } from "@/lib/erp/money";
import { estadosFacturaPorFolio } from "@/lib/erp/facturacion-link.server";

export default async function HistorialPage() {
  const user = await requireCan("POS", "read");

  const tickets = await prisma.ticketPOS.findMany({
    where: user.esAdmin ? {} : { tiendaId: { in: [...user.tiendas] } },
    orderBy: { fecha: "desc" },
    take: 50,
    include: { tienda: true },
  });
  const estados = await estadosFacturaPorFolio(tickets.map((t) => t.folioTicket ?? t.folio));

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Historial de ventas</h1>
        <Link href="/pos" className="text-sm text-neutral-500 hover:text-neutral-800">← Punto de venta</Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Folio</th>
              <th className="px-4 py-2 font-medium">Fecha</th>
              <th className="px-4 py-2 font-medium">Tienda</th>
              <th className="px-4 py-2 font-medium">Tipo</th>
              <th className="px-4 py-2 font-medium text-right">Total</th>
              <th className="px-4 py-2 font-medium">Factura</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-neutral-400">Sin ventas registradas.</td></tr>
            )}
            {tickets.map((t) => {
              const est = estados.get(t.folioTicket ?? t.folio);
              return (
                <tr key={t.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 font-mono text-neutral-800">{t.folio}</td>
                  <td className="px-4 py-2 text-neutral-500">{t.fecha.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-2 text-neutral-500">{t.tienda.codigo}</td>
                  <td className="px-4 py-2 text-neutral-500">{t.tipo === "DEVOLUCION" ? "Devolución" : "Venta"}</td>
                  <td className="px-4 py-2 text-right text-neutral-800">{formatMXN(t.total.toString())}</td>
                  <td className="px-4 py-2">
                    {est?.facturada ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700" title={est.uuid}>FACTURADA</span>
                    ) : (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">SIN FACTURA</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-400">
        El cliente se autofactura en el portal con el folio del ticket; aquí se refleja al timbrarse.
      </p>
    </div>
  );
}
