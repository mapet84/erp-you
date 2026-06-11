import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { CatalogForm } from "@/components/erp/catalog-form";
import { DeleteButton } from "@/components/erp/delete-button";
import { crearCanal, guardarMediosPrincipales, guardarComisiones, borrarCanal } from "../actions";

export default async function CanalesPage() {
  const user = await requireCan("GESTION", "configure");
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
        {/* Form vacío asociado por id; los selects usan form="mp-form" para no
            anidarse con el form de borrar canal. */}
        <form id="mp-form" action={guardarMediosPrincipales} />
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500"><tr><th className="px-4 py-2 font-medium">Canal</th><th className="px-4 py-2 font-medium">Medio principal</th><th className="px-4 py-2" /></tr></thead>
            <tbody>
              {canales.map((c) => (
                <tr key={c.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 text-neutral-800">{c.nombre}</td>
                  <td className="px-4 py-2">
                    <select name={`mp_${c.id}`} form="mp-form" defaultValue={c.medioPagoPrincipalId ?? ""} className="rounded-md border border-neutral-300 px-2 py-1 text-sm">
                      <option value="">—</option>
                      {medios.map((m) => (<option key={m.id} value={m.id}>{m.nombre}</option>))}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-right">{user.esAdmin && <DeleteButton action={borrarCanal} id={c.id} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="submit" form="mp-form" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">Guardar medios principales</button>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-800">Comisiones (%) por canal y medio de pago</h2>
        <form action={guardarComisiones} className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500"><tr><th className="px-4 py-2 font-medium">Canal</th><th className="px-4 py-2 font-medium">Medio</th><th className="px-4 py-2 font-medium">Comisión %</th></tr></thead>
              <tbody>
                {canales.flatMap((can) => medios.map((med) => (
                  <tr key={`${can.id}:${med.id}`} className="border-t border-neutral-100">
                    <td className="px-4 py-2 text-neutral-800">{can.nombre}</td>
                    <td className="px-4 py-2 text-neutral-500">{med.nombre}</td>
                    <td className="px-4 py-2">
                      <input name={`c_${can.id}_${med.id}`} inputMode="decimal" defaultValue={com.get(`${can.id}:${med.id}`) ?? ""} placeholder="—" className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-sm" />
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
          <button type="submit" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">Guardar comisiones</button>
        </form>
      </section>
    </div>
  );
}
