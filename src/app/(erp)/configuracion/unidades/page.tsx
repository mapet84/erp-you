import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { CatalogForm } from "@/components/erp/catalog-form";
import { DeleteButton } from "@/components/erp/delete-button";
import { crearUnidad, crearConversion, borrarConversion, borrarUnidad } from "../actions";

export default async function UnidadesPage() {
  const user = await requireCan("GESTION", "configure");
  const [unidades, conversiones] = await Promise.all([
    prisma.unidad.findMany({ orderBy: { codigo: "asc" } }),
    prisma.conversionUnidad.findMany({ include: { origen: true, destino: true } }),
  ]);
  const opciones = unidades.map((u) => ({ value: u.id, label: `${u.codigo} · ${u.nombre}` }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Unidades y conversiones</h1>
        <p className="mt-1 text-sm text-neutral-500">Unidades de medida y los factores para convertir entre ellas.</p>
      </div>

      <section className="space-y-3">
        <CatalogForm
          action={crearUnidad}
          campos={[
            { name: "codigo", label: "Código", required: true, width: "w-28" },
            { name: "nombre", label: "Nombre", required: true },
          ]}
        />
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500"><tr><th className="px-4 py-2 font-medium">Código</th><th className="px-4 py-2 font-medium">Nombre</th><th className="px-4 py-2" /></tr></thead>
            <tbody>
              {unidades.map((u) => (
                <tr key={u.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 font-mono text-neutral-800">{u.codigo}</td>
                  <td className="px-4 py-2 text-neutral-800">{u.nombre}</td>
                  <td className="px-4 py-2 text-right">{user.esAdmin && <DeleteButton action={borrarUnidad} id={u.id} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-800">Conversiones — 1 origen = factor × destino</h2>
        <CatalogForm
          action={crearConversion}
          submitLabel="Agregar conversión"
          campos={[
            { name: "origenId", label: "Origen", required: true, options: opciones },
            { name: "factor", label: "Factor", required: true, type: "number", width: "w-28" },
            { name: "destinoId", label: "Destino", required: true, options: opciones },
          ]}
        />
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500"><tr><th className="px-4 py-2 font-medium">Conversión</th><th className="px-4 py-2" /></tr></thead>
            <tbody>
              {conversiones.length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-center text-neutral-400">Sin conversiones.</td></tr>}
              {conversiones.map((c) => (
                <tr key={c.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 text-neutral-800">1 {c.origen.codigo} = {c.factor.toString()} {c.destino.codigo}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={borrarConversion}><input type="hidden" name="id" value={c.id} /><button className="text-xs text-red-500 hover:text-red-700">Borrar</button></form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
