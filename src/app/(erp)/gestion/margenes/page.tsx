import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { guardarMargenes } from "./actions";

export default async function MargenesPage() {
  await requireCan("GESTION", "configure");
  const [categorias, canales, margenes] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
    prisma.canal.findMany({ orderBy: { nombre: "asc" } }),
    prisma.margenObjetivo.findMany(),
  ]);
  const mapa = new Map(margenes.map((m) => [`${m.categoriaId}:${m.canalId}`, m.margen.toString()]));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Márgenes objetivo</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Margen (%) por categoría y canal. Define el precio sugerido a partir del costo de compra.
          Llena todo y guarda una sola vez. Vacío = sin margen.
        </p>
      </div>

      <form action={guardarMargenes} className="space-y-3">
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Categoría</th>
                <th className="px-4 py-2 font-medium">Canal</th>
                <th className="px-4 py-2 font-medium">Margen %</th>
              </tr>
            </thead>
            <tbody>
              {categorias.flatMap((cat) =>
                canales.map((can) => (
                  <tr key={`${cat.id}:${can.id}`} className="border-t border-neutral-100">
                    <td className="px-4 py-2 text-neutral-800">{cat.nombre}</td>
                    <td className="px-4 py-2 text-neutral-500">{can.nombre}</td>
                    <td className="px-4 py-2">
                      <input
                        name={`m_${cat.id}_${can.id}`}
                        inputMode="decimal"
                        defaultValue={mapa.get(`${cat.id}:${can.id}`) ?? ""}
                        placeholder="—"
                        className="w-24 rounded-md border border-neutral-300 px-2 py-1 text-sm"
                      />
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
        <button type="submit" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
          Guardar márgenes
        </button>
      </form>
    </div>
  );
}
