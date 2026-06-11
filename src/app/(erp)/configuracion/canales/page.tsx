import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { CatalogForm } from "@/components/erp/catalog-form";
import { crearCanal, actualizarMedioPrincipal, guardarComision } from "../actions";

export default async function CanalesPage() {
  await requireCan("GESTION", "configure");
  const [canales, medios, comisiones] = await Promise.all([
    prisma.canal.findMany({ orderBy: { nombre: "asc" } }),
    prisma.medioPago.findMany({ orderBy: { nombre: "asc" } }),
    prisma.comision.findMany(),
  ]);
  const medioOpts = medios.map((m) => ({ value: m.id, label: m.nombre }));
  const com = new Map(comisiones.map((c) => [`${c.canalId}:${c.medioPagoId}`, c.comisionPct.toString()]));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Canales</h1>
        <p className="mt-1 text-sm text-neutral-500">Canal de venta, su medio de pago principal y la comisión por medio.</p>
      </div>

      <CatalogForm
        action={crearCanal}
        campos={[
          { name: "nombre", label: "Nombre del canal", required: true },
          { name: "medioPagoPrincipalId", label: "Medio principal", options: medioOpts },
        ]}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-800">Canales y medio principal</h2>
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500"><tr><th className="px-4 py-2 font-medium">Canal</th><th className="px-4 py-2 font-medium">Medio principal</th></tr></thead>
            <tbody>
              {canales.map((c) => (
                <tr key={c.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 text-neutral-800">{c.nombre}</td>
                  <td className="px-4 py-2">
                    <form action={actualizarMedioPrincipal} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={c.id} />
                      <select name="medioPagoPrincipalId" defaultValue={c.medioPagoPrincipalId ?? ""} className="rounded-md border border-neutral-300 px-2 py-1 text-sm">
                        <option value="">—</option>
                        {medios.map((m) => (<option key={m.id} value={m.id}>{m.nombre}</option>))}
                      </select>
                      <button className="text-xs text-neutral-500 hover:text-neutral-900">Guardar</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-800">Comisiones (%) por canal y medio de pago</h2>
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500"><tr><th className="px-4 py-2 font-medium">Canal</th><th className="px-4 py-2 font-medium">Medio</th><th className="px-4 py-2 font-medium">Comisión %</th></tr></thead>
            <tbody>
              {canales.flatMap((can) => medios.map((med) => (
                <tr key={`${can.id}:${med.id}`} className="border-t border-neutral-100">
                  <td className="px-4 py-2 text-neutral-800">{can.nombre}</td>
                  <td className="px-4 py-2 text-neutral-500">{med.nombre}</td>
                  <td className="px-4 py-2">
                    <form action={guardarComision} className="flex items-center gap-2">
                      <input type="hidden" name="canalId" value={can.id} />
                      <input type="hidden" name="medioPagoId" value={med.id} />
                      <input name="comisionPct" inputMode="decimal" defaultValue={com.get(`${can.id}:${med.id}`) ?? ""} placeholder="0" className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-sm" />
                      <button className="text-xs text-neutral-500 hover:text-neutral-900">Guardar</button>
                    </form>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
