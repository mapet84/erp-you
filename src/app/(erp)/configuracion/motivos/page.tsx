import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { CatalogForm } from "@/components/erp/catalog-form";
import { crearMotivo, borrarMotivo } from "../actions";

export default async function MotivosPage() {
  await requireCan("GESTION", "configure");
  const motivos = await prisma.motivoAjuste.findMany({ orderBy: { nombre: "asc" } });
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-xl font-semibold text-neutral-900">Motivos de ajuste de inventario</h1>
      <CatalogForm action={crearMotivo} campos={[{ name: "nombre", label: "Nombre", required: true }]} />
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500"><tr><th className="px-4 py-2 font-medium">Nombre</th><th className="px-4 py-2" /></tr></thead>
          <tbody>
            {motivos.length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-center text-neutral-400">Sin motivos.</td></tr>}
            {motivos.map((m) => (
              <tr key={m.id} className="border-t border-neutral-100">
                <td className="px-4 py-2 text-neutral-800">{m.nombre}</td>
                <td className="px-4 py-2 text-right"><form action={borrarMotivo}><input type="hidden" name="id" value={m.id} /><button className="text-xs text-red-500 hover:text-red-700">Borrar</button></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
