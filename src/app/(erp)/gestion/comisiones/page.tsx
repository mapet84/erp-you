import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { guardarComision } from "./actions";

export default async function ComisionesPage() {
  await requireCan("GESTION", "configure");
  const [canales, medios, comisiones] = await Promise.all([
    prisma.canal.findMany({ orderBy: { nombre: "asc" } }),
    prisma.medioPago.findMany({ orderBy: { nombre: "asc" } }),
    prisma.comision.findMany(),
  ]);
  const mapa = new Map(comisiones.map((c) => [`${c.canalId}:${c.medioPagoId}`, c.comisionPct.toString()]));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Comisiones</h1>
        <p className="mt-1 text-sm text-neutral-500">Comisión (%) por canal y medio de pago. La aplica el POS y las finanzas.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Canal</th>
              <th className="px-4 py-2 font-medium">Medio de pago</th>
              <th className="px-4 py-2 font-medium">Comisión %</th>
            </tr>
          </thead>
          <tbody>
            {canales.flatMap((can) =>
              medios.map((med) => (
                <tr key={`${can.id}:${med.id}`} className="border-t border-neutral-100">
                  <td className="px-4 py-2 text-neutral-800">{can.nombre}</td>
                  <td className="px-4 py-2 text-neutral-500">{med.nombre}</td>
                  <td className="px-4 py-2">
                    <form action={guardarComision} className="flex items-center gap-2">
                      <input type="hidden" name="canalId" value={can.id} />
                      <input type="hidden" name="medioPagoId" value={med.id} />
                      <input name="comisionPct" inputMode="decimal" defaultValue={mapa.get(`${can.id}:${med.id}`) ?? ""} placeholder="0" className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-sm" />
                      <button className="text-xs text-neutral-500 hover:text-neutral-900">Guardar</button>
                    </form>
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
