import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { construirEstadoResultados } from "@/lib/erp/estado-resultados";
import { formatMXN, type Decimal } from "@/lib/erp/money";

function rangoMesActual() {
  const hoy = new Date();
  const f1 = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const f2 = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);
  return { f1, f2 };
}

function Linea({ label, valor, fuerte = false, indent = false }: { label: string; valor: Decimal; fuerte?: boolean; indent?: boolean }) {
  return (
    <div className={`flex justify-between px-4 py-1.5 ${fuerte ? "border-t border-neutral-200 font-semibold text-neutral-900" : "text-neutral-600"}`}>
      <span className={indent ? "pl-4" : ""}>{label}</span>
      <span>{formatMXN(valor)}</span>
    </div>
  );
}

export default async function EstadoResultadosPage({
  searchParams,
}: {
  searchParams: Promise<{ f1?: string; f2?: string; tienda?: string }>;
}) {
  const user = await requireCan("FINANZAS", "read");
  const sp = await searchParams;
  const def = rangoMesActual();
  const f1 = sp.f1 ? new Date(`${sp.f1}T00:00:00`) : def.f1;
  const f2 = sp.f2 ? new Date(`${sp.f2}T23:59:59`) : def.f2;

  const tiendas = await prisma.tienda.findMany({
    where: { activo: true, ...(user.esAdmin ? {} : { id: { in: [...user.tiendas] } }) },
    orderBy: { codigo: "asc" },
  });
  const tiendaId = sp.tienda && tiendas.some((t) => t.id === sp.tienda) ? sp.tienda : undefined;

  const [ventas, gastos] = await Promise.all([
    prisma.venta.findMany({
      where: { fecha: { gte: f1, lte: f2 }, ...(tiendaId ? { tiendaId } : {}) },
      select: { subtotalSinIva: true, comisionMonto: true, costo: true },
    }),
    prisma.gasto.findMany({
      where: {
        fecha: { gte: f1, lte: f2 },
        ...(tiendaId ? { OR: [{ tiendaId }, { tiendaId: null }] } : {}),
      },
      include: { categoriaGasto: true },
    }),
  ]);

  const er = construirEstadoResultados(
    ventas.map((v) => ({ subtotalSinIva: v.subtotalSinIva, comisionMonto: v.comisionMonto, costo: v.costo })),
    gastos.map((g) => ({ tipoER: g.categoriaGasto.tipoER, monto: g.monto, isr: g.isr })),
  );

  const iso = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Estado de resultados</h1>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4 text-sm">
        <div><label className="block text-xs text-neutral-500">Desde</label><input name="f1" type="date" defaultValue={iso(f1)} className="mt-1 rounded-md border border-neutral-300 px-2 py-1.5" /></div>
        <div><label className="block text-xs text-neutral-500">Hasta</label><input name="f2" type="date" defaultValue={iso(f2)} className="mt-1 rounded-md border border-neutral-300 px-2 py-1.5" /></div>
        <div>
          <label className="block text-xs text-neutral-500">Tienda</label>
          <select name="tienda" defaultValue={tiendaId ?? ""} className="mt-1 rounded-md border border-neutral-300 px-2 py-1.5">
            <option value="">Todas</option>
            {tiendas.map((t) => (<option key={t.id} value={t.id}>{t.codigo}</option>))}
          </select>
        </div>
        <button className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-800">Aplicar</button>
      </form>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white text-sm">
        <Linea label="Ingresos netos" valor={er.ingresosNetos} />
        <Linea label="Costo de ventas" valor={er.costoVentas} indent />
        <Linea label="Comisiones" valor={er.comisiones} indent />
        <Linea label="Utilidad bruta" valor={er.utilidadBruta} fuerte />
        <Linea label="Gastos operativos (admin)" valor={er.gastosOperativosAdmin} indent />
        <Linea label="Gastos operativos (ventas)" valor={er.gastosOperativosVentas} indent />
        <Linea label="Utilidad operativa (EBIT)" valor={er.ebit} fuerte />
        <Linea label="Otros ingresos" valor={er.otrosIngresos} indent />
        <Linea label="Otros gastos" valor={er.otrosGastos} indent />
        <Linea label="Ingresos financieros" valor={er.ingresosFinancieros} indent />
        <Linea label="Gastos financieros" valor={er.gastosFinancieros} indent />
        <Linea label="Utilidad antes de impuestos" valor={er.uai} fuerte />
        <Linea label="Impuestos / ISR" valor={er.impuestos} indent />
        <Linea label="Utilidad neta" valor={er.utilidadNeta} fuerte />
      </div>

      <p className="text-xs text-neutral-400">
        Márgenes — bruto {er.margenBruto.toString()}% · operativo {er.margenOperativo.toString()}% · neto {er.margenNeto.toString()}%
      </p>
    </div>
  );
}
