import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { CatalogForm } from "@/components/erp/catalog-form";
import { DeleteButton } from "@/components/erp/delete-button";
import { crearCategoria, actualizarAbrevCategoria, borrarCategoria } from "../actions";

export default async function CategoriasPage() {
  const user = await requireCan("GESTION", "configure");
  const categorias = await prisma.categoria.findMany({ orderBy: { nombre: "asc" } });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Categorías</h1>
        <p className="mt-1 text-sm text-neutral-500">La abreviatura forma parte del código de recetas y productos.</p>
      </div>
      <CatalogForm
        action={crearCategoria}
        campos={[
          { name: "nombre", label: "Nombre", required: true },
          { name: "abreviatura", label: "Abreviatura (auto si vacío)", width: "w-40" },
        ]}
      />
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr><th className="px-4 py-2 font-medium">Nombre</th><th className="px-4 py-2 font-medium">Abreviatura</th><th className="px-4 py-2" /></tr>
          </thead>
          <tbody>
            {categorias.map((c) => (
              <tr key={c.id} className="border-t border-neutral-100">
                <td className="px-4 py-2 text-neutral-800">{c.nombre}</td>
                <td className="px-4 py-2">
                  <form action={actualizarAbrevCategoria} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={c.id} />
                    <input name="abreviatura" defaultValue={c.abreviatura ?? ""} className="w-24 rounded-md border border-neutral-300 px-2 py-1 text-sm uppercase" />
                    <button className="text-xs text-neutral-500 hover:text-neutral-900">Guardar</button>
                  </form>
                </td>
                <td className="px-4 py-2 text-right">{user.esAdmin && <DeleteButton action={borrarCategoria} id={c.id} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
