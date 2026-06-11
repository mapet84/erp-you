import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { DeleteButton } from "@/components/erp/delete-button";
import { BulkDeleteBar } from "@/components/erp/bulk-delete-bar";
import { RecetaForm } from "./receta-form";
import { borrarReceta, borrarRecetasMasivo } from "./actions";

export default async function RecetasPage() {
  const user = await requireCan("GESTION", "read");
  const puedeEditar = user.esAdmin || user.roles.some((r) => r.modulo === "GESTION" && r.rol === "CONFIGURADOR");
  const puedeBorrar = user.esAdmin;

  const [recetas, categorias, tamanos, ingredientes, semis] = await Promise.all([
    prisma.receta.findMany({
      orderBy: { sku: "asc" },
      include: { categoria: true, _count: { select: { componentes: true } } },
    }),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
    prisma.tamano.findMany({ orderBy: { nombre: "asc" } }),
    prisma.ingrediente.findMany({ orderBy: { codigo: "asc" } }),
    prisma.semiTerminado.findMany({ orderBy: { sku: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Recetas</h1>
          <p className="mt-1 text-sm text-neutral-500">Define recetas y consulta su costo y precio sugerido.</p>
        </div>
        {puedeBorrar && <BulkDeleteBar formId="bulk-rec" action={borrarRecetasMasivo} />}
      </div>

      {puedeEditar && (
        ingredientes.length === 0 ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Primero captura ingredientes para poder armar recetas.
          </p>
        ) : (
          <RecetaForm
            categorias={categorias.map((c) => ({ id: c.id, nombre: c.nombre }))}
            tamanos={tamanos.map((t) => ({ id: t.id, nombre: t.nombre }))}
            ingredientes={ingredientes.map((i) => ({ id: i.id, codigo: i.codigo, nombre: i.nombre }))}
            semis={semis.map((s) => ({ id: s.id, codigo: s.sku, nombre: s.nombre }))}
          />
        )
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              {puedeBorrar && <th className="px-3 py-2" />}
              <th className="px-4 py-2 font-medium">SKU</th>
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">Categoría</th>
              <th className="px-4 py-2 font-medium">Comp.</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {recetas.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-neutral-400">Aún no hay recetas.</td></tr>
            )}
            {recetas.map((r) => (
              <tr key={r.id} className="border-t border-neutral-100">
                {puedeBorrar && <td className="px-3 py-2"><input type="checkbox" name="ids" value={r.id} form="bulk-rec" /></td>}
                <td className="px-4 py-2 font-mono text-neutral-800">{r.sku}</td>
                <td className="px-4 py-2 text-neutral-800">{r.nombre}</td>
                <td className="px-4 py-2 text-neutral-500">{r.categoria.nombre}</td>
                <td className="px-4 py-2 text-neutral-500">{r._count.componentes}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/gestion/recetas/${r.id}`} className="text-xs font-medium text-neutral-600 hover:text-neutral-900">Ver</Link>
                    {puedeEditar && <Link href={`/gestion/recetas/${r.id}/editar`} className="text-xs text-neutral-500 hover:text-neutral-900">Editar</Link>}
                    {puedeBorrar && <DeleteButton action={borrarReceta} id={r.id} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
