import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { formatMXN } from "@/lib/erp/money";
import { IngredienteForm } from "./ingrediente-form";
import { actualizarCostoCompra } from "./actions";

export default async function IngredientesPage() {
  const user = await requireCan("GESTION", "read");
  const puedeEditar = user.esAdmin || user.roles.some((r) => r.modulo === "GESTION" && r.rol === "CONFIGURADOR");

  const [ingredientes, unidades] = await Promise.all([
    prisma.ingrediente.findMany({ orderBy: { codigo: "asc" }, include: { unidad: true } }),
    prisma.unidad.findMany({ orderBy: { codigo: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Ingredientes</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Materia prima. El costo de compra es la base del costeo y del precio.
        </p>
      </div>

      {puedeEditar && <IngredienteForm unidades={unidades.map((u) => ({ id: u.id, codigo: u.codigo }))} />}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Código</th>
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">Unidad</th>
              <th className="px-4 py-2 font-medium">Costo compra</th>
            </tr>
          </thead>
          <tbody>
            {ingredientes.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-neutral-400">Aún no hay ingredientes.</td></tr>
            )}
            {ingredientes.map((i) => (
              <tr key={i.id} className="border-t border-neutral-100">
                <td className="px-4 py-2 font-mono text-neutral-800">{i.codigo}</td>
                <td className="px-4 py-2 text-neutral-800">{i.nombre}</td>
                <td className="px-4 py-2 text-neutral-500">{i.unidad.codigo}</td>
                <td className="px-4 py-2">
                  {puedeEditar ? (
                    <form action={actualizarCostoCompra} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={i.id} />
                      <input
                        name="costoCompra"
                        defaultValue={i.costoCompra.toString()}
                        inputMode="decimal"
                        className="w-24 rounded-md border border-neutral-300 px-2 py-1 text-sm"
                      />
                      <button type="submit" className="text-xs text-neutral-500 hover:text-neutral-900">Guardar</button>
                    </form>
                  ) : (
                    formatMXN(i.costoCompra.toString())
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
