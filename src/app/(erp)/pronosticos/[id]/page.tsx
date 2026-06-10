import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { can } from "@/lib/erp/rbac";
import { Decimal, formatMXN } from "@/lib/erp/money";
import { confirmarPronostico } from "../actions";

export default async function PronosticoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCan("PRONOSTICOS", "read");
  const puede = can(user, "PRONOSTICOS", "write");
  const { id } = await params;

  const pron = await prisma.pronostico.findUnique({
    where: { id },
    include: {
      lineas: { orderBy: { ventas: "desc" } },
      compras: { orderBy: { costoEstimado: "desc" } },
      gastos: { orderBy: { monto: "desc" } },
    },
  });
  if (!pron) notFound();
  const t = await prisma.tienda.findUnique({ where: { id: pron.tiendaId } });

  const totalVentas = pron.lineas.reduce((a, l) => a.plus(l.ventas), new Decimal(0));
  const totalCompras = pron.compras.reduce((a, c) => a.plus(c.costoEstimado), new Decimal(0));
  const totalGastos = pron.gastos.reduce((a, g) => a.plus(g.monto), new Decimal(0));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/pronosticos" className="text-sm text-neutral-500 hover:text-neutral-800">← Pronósticos</Link>
          <h1 className="mt-1 text-xl font-semibold text-neutral-900">Pronóstico {t?.codigo ?? ""}</h1>
          <p className="text-sm text-neutral-500">
            {pron.metodo} · {pron.horizonteSemanas} sem · historia {pron.semanasHistoria} · crec. {pron.crecimiento.toString()}
            {pron.usaTendencia ? " · tendencia" : ""}
          </p>
        </div>
        <div className="text-right">
          <span className={pron.estado === "CONFIRMADO" ? "rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700" : "rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700"}>{pron.estado}</span>
          {puede && pron.estado === "BORRADOR" && (
            <form action={confirmarPronostico} className="mt-2">
              <input type="hidden" name="id" value={pron.id} />
              <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100">Confirmar</button>
            </form>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-800">Ventas proyectadas — {formatMXN(totalVentas)}</h2>
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr><th className="px-4 py-2 font-medium">Artículo</th><th className="px-4 py-2 font-medium text-right">Unidades</th><th className="px-4 py-2 font-medium text-right">Ventas</th><th className="px-4 py-2 font-medium text-right">Costo</th></tr>
            </thead>
            <tbody>
              {pron.lineas.length === 0 && (<tr><td colSpan={4} className="px-4 py-6 text-center text-neutral-400">Sin historial suficiente para proyectar.</td></tr>)}
              {pron.lineas.map((l) => (
                <tr key={l.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 text-neutral-800">{l.articulo}</td>
                  <td className="px-4 py-2 text-right text-neutral-500">{l.unidades.toString()}</td>
                  <td className="px-4 py-2 text-right text-neutral-800">{formatMXN(l.ventas)}</td>
                  <td className="px-4 py-2 text-right text-neutral-500">{formatMXN(l.costo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-800">Compras sugeridas (BOM) — {formatMXN(totalCompras)}</h2>
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr><th className="px-4 py-2 font-medium">Ingrediente</th><th className="px-4 py-2 font-medium text-right">Cantidad</th><th className="px-4 py-2 font-medium text-right">Redondeada</th><th className="px-4 py-2 font-medium text-right">Costo est.</th></tr>
            </thead>
            <tbody>
              {pron.compras.length === 0 && (<tr><td colSpan={4} className="px-4 py-6 text-center text-neutral-400">Sin compras proyectadas.</td></tr>)}
              {pron.compras.map((c) => (
                <tr key={c.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 text-neutral-800">{c.nombre}</td>
                  <td className="px-4 py-2 text-right text-neutral-500">{c.cantidad.toString()}</td>
                  <td className="px-4 py-2 text-right text-neutral-700">{c.cantidadRedondeada.toString()}</td>
                  <td className="px-4 py-2 text-right text-neutral-700">{formatMXN(c.costoEstimado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-800">Gastos proyectados — {formatMXN(totalGastos)}</h2>
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr><th className="px-4 py-2 font-medium">Categoría</th><th className="px-4 py-2 font-medium">Periodicidad</th><th className="px-4 py-2 font-medium text-right">Ocurrencias</th><th className="px-4 py-2 font-medium text-right">Monto</th></tr>
            </thead>
            <tbody>
              {pron.gastos.length === 0 && (<tr><td colSpan={4} className="px-4 py-6 text-center text-neutral-400">Sin gastos recurrentes en el horizonte.</td></tr>)}
              {pron.gastos.map((g) => (
                <tr key={g.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 text-neutral-800">{g.categoria}</td>
                  <td className="px-4 py-2 text-neutral-500">{g.periodicidad}</td>
                  <td className="px-4 py-2 text-right text-neutral-500">{g.ocurrencias}</td>
                  <td className="px-4 py-2 text-right text-neutral-700">{formatMXN(g.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
