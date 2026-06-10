import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { RecetaForm } from "./receta-form";

export default async function RecetasPage() {
  const user = await requireCan("GESTION", "read");
  const puedeEditar = user.esAdmin || user.roles.some((r) => r.modulo === "GESTION" && r.rol === "CONFIGURADOR");

  const [recetas, categorias, ingredientes] = await Promise.all([
    prisma.receta.findMany({
      orderBy: { sku: "asc" },
      include: { categoria: true, _count: { select: { componentes: true } } },
    }),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
    prisma.ingrediente.findMany({ orderBy: { codigo: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Recetas</h1>
        <p className="mt-1 text-sm text-neutral-500">Define recetas y consulta su costo y precio sugerido.</p>
      </div>

      {puedeEditar && (
        ingredientes.length === 0 ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Primero captura ingredientes para poder armar recetas.
          </p>
        ) : (
          <RecetaForm
            categorias={categorias.map((c) => ({ id: c.id, nombre: c.nombre }))}
            ingredientes={ingredientes.map((i) => ({ id: i.id, codigo: i.codigo, nombre: i.nombre }))}
          />
        )
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">SKU</th>
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">Categoría</th>
              <th className="px-4 py-2 font-medium">Comp.</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {recetas.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-400">Aún no hay recetas.</td></tr>
            )}
            {recetas.map((r) => (
              <tr key={r.id} className="border-t border-neutral-100">
                <td className="px-4 py-2 font-mono text-neutral-800">{r.sku}</td>
                <td className="px-4 py-2 text-neutral-800">{r.nombre}</td>
                <td className="px-4 py-2 text-neutral-500">{r.categoria.nombre}</td>
                <td className="px-4 py-2 text-neutral-500">{r._count.componentes}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/gestion/recetas/${r.id}`} className="text-xs font-medium text-neutral-600 hover:text-neutral-900">
                    Ver costo
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
