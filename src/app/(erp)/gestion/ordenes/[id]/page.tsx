import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { can } from "@/lib/erp/rbac";
import { formatMXN } from "@/lib/erp/money";
import { marcarEntregada, marcarFacturada, marcarCobrada } from "../actions";

const fmtFecha = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "—");

export default async function OrdenDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCan("GESTION", "read");
  const puede = can(user, "GESTION", "write");
  const { id } = await params;
  const orden = await prisma.ordenVenta.findUnique({
    where: { id },
    include: { cliente: true, tienda: true, lineas: true },
  });
  if (!orden) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/gestion/ordenes" className="text-sm text-neutral-500 hover:text-neutral-800">← Órdenes</Link>
        <h1 className="mt-1 text-xl font-semibold text-neutral-900"><span className="font-mono text-neutral-500">{orden.folio}</span> · {orden.cliente.nombre}</h1>
        <p className="text-sm text-neutral-500">{orden.tienda.codigo} · {fmtFecha(orden.fecha)} · pago estimado {fmtFecha(orden.fechaPagoEstimada)}</p>
      </div>

      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr><th className="px-4 py-2 font-medium">Artículo</th><th className="px-4 py-2 font-medium text-right">Cant.</th><th className="px-4 py-2 font-medium text-right">Precio</th><th className="px-4 py-2 font-medium text-right">Subtotal</th></tr>
          </thead>
          <tbody>
            {orden.lineas.map((l) => (
              <tr key={l.id} className="border-t border-neutral-100">
                <td className="px-4 py-2 text-neutral-800">{l.articulo}</td>
                <td className="px-4 py-2 text-right text-neutral-500">{l.qty.toString()}</td>
                <td className="px-4 py-2 text-right text-neutral-500">{formatMXN(l.precioUnit.toString())}</td>
                <td className="px-4 py-2 text-right text-neutral-800">{formatMXN(l.subtotal.toString())}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-neutral-200 font-medium">
              <td className="px-4 py-2" colSpan={3}>Total</td>
              <td className="px-4 py-2 text-right">{formatMXN(orden.totalPedido.toString())}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <EstadoCard titulo="Entrega" estado={orden.estadoEntrega} fecha={fmtFecha(orden.fechaEntrega)}>
          {puede && orden.estadoEntrega === "PENDIENTE" && (
            <form action={marcarEntregada}><input type="hidden" name="id" value={orden.id} /><button className="text-xs font-medium text-neutral-700 hover:text-neutral-900">Marcar entregada</button></form>
          )}
        </EstadoCard>
        <EstadoCard titulo="Factura" estado={orden.estadoFactura} fecha={fmtFecha(orden.fechaFacturacion)}>
          {puede && orden.estadoFactura === "SIN_FACTURA" && (
            <form action={marcarFacturada} className="space-y-1">
              <input type="hidden" name="id" value={orden.id} />
              <input name="folioFactura" placeholder="folio factura" className="w-full rounded border border-neutral-300 px-2 py-1 text-xs" />
              <button className="text-xs font-medium text-neutral-700 hover:text-neutral-900">Marcar facturada</button>
            </form>
          )}
        </EstadoCard>
        <EstadoCard titulo="Cobro" estado={orden.estadoCobro} fecha={fmtFecha(orden.fechaPago)}>
          {puede && orden.estadoCobro === "PENDIENTE" && (
            <form action={marcarCobrada}><input type="hidden" name="id" value={orden.id} /><button className="text-xs font-medium text-neutral-700 hover:text-neutral-900">Marcar cobrada</button></form>
          )}
        </EstadoCard>
      </section>
    </div>
  );
}

function EstadoCard({ titulo, estado, fecha, children }: { titulo: string; estado: string; fecha: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-xs text-neutral-500">{titulo}</p>
      <p className="mt-1 font-medium text-neutral-900">{estado}</p>
      <p className="text-xs text-neutral-400">{fecha}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
