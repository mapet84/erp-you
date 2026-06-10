import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { costosCompraPorReceta } from "@/lib/erp/costeo.server";
import { precioDesdeMargen, pvSinIva, margen as calcMargen } from "@/lib/erp/pricing";
import { Decimal, formatMXN, formatPct } from "@/lib/erp/money";
import { guardarPrecioReceta, repreciarReceta, repreciarTodo } from "./actions";

export default async function PreciosPage() {
  const user = await requireCan("GESTION", "read");
  const puedeEditar = user.esAdmin || user.roles.some((r) => r.modulo === "GESTION" && r.rol === "CONFIGURADOR");

  const [recetas, canales, margenes, costos] = await Promise.all([
    prisma.receta.findMany({ orderBy: { sku: "asc" }, include: { categoria: true, precios: true } }),
    prisma.canal.findMany({ orderBy: { nombre: "asc" } }),
    prisma.margenObjetivo.findMany(),
    costosCompraPorReceta(),
  ]);
  const margenObj = new Map(margenes.map((m) => [`${m.categoriaId}:${m.canalId}`, m.margen]));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Precios y márgenes</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Costo de compra, precio actual vs sugerido (impacto) y margen logrado por canal.
          </p>
        </div>
        {puedeEditar && (
          <form action={repreciarTodo}>
            <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
              Repreciar todo al margen
            </button>
          </form>
        )}
      </div>

      {recetas.length === 0 && <p className="text-sm text-neutral-400">Aún no hay recetas.</p>}

      {recetas.map((r) => {
        const costo = costos.get(r.id) ?? new Decimal(0);
        const precioActual = new Map(r.precios.map((p) => [p.canalId, p.precio]));
        return (
          <div key={r.id} className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-neutral-500">{r.sku}</span>{" "}
                <span className="font-medium text-neutral-900">{r.nombre}</span>
                <span className="ml-2 text-xs text-neutral-400">{r.categoria.nombre}</span>
              </div>
              <span className="text-sm text-neutral-500">Costo {formatMXN(costo)}</span>
            </div>

            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-neutral-400">
                <tr>
                  <th className="py-1 font-medium">Canal</th>
                  <th className="py-1 font-medium">Margen obj.</th>
                  <th className="py-1 font-medium">Precio actual</th>
                  <th className="py-1 font-medium">Sugerido</th>
                  <th className="py-1 font-medium">Δ</th>
                  <th className="py-1 font-medium">Margen actual</th>
                </tr>
              </thead>
              <tbody>
                {canales.map((can) => {
                  const m = margenObj.get(`${r.categoriaId}:${can.id}`);
                  const sugerido = m ? precioDesdeMargen(costo, m) : null;
                  const actual = precioActual.get(can.id) ?? null;
                  const delta = sugerido && actual ? sugerido.minus(actual) : null;
                  const margenActual = actual ? calcMargen(pvSinIva(actual), costo).mul(100) : null;
                  return (
                    <tr key={can.id} className="border-t border-neutral-100">
                      <td className="py-1 text-neutral-700">{can.nombre}</td>
                      <td className="py-1 text-neutral-500">{m ? formatPct(m) : "—"}</td>
                      <td className="py-1">
                        {puedeEditar ? (
                          <form action={guardarPrecioReceta} className="flex items-center gap-1">
                            <input type="hidden" name="recetaId" value={r.id} />
                            <input type="hidden" name="canalId" value={can.id} />
                            <input name="precio" defaultValue={actual?.toString() ?? ""} inputMode="decimal" className="w-24 rounded-md border border-neutral-300 px-2 py-1 text-sm" />
                            <button className="text-xs text-neutral-400 hover:text-neutral-800">✓</button>
                          </form>
                        ) : actual ? formatMXN(actual) : "—"}
                      </td>
                      <td className="py-1 text-neutral-500">{sugerido ? formatMXN(sugerido) : "—"}</td>
                      <td className={`py-1 ${delta && !delta.isZero() ? "text-amber-600" : "text-neutral-400"}`}>
                        {delta ? formatMXN(delta) : "—"}
                      </td>
                      <td className="py-1 text-neutral-500">{margenActual ? `${margenActual.toDecimalPlaces(1)}%` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {puedeEditar && (
              <form action={repreciarReceta} className="mt-2">
                <input type="hidden" name="recetaId" value={r.id} />
                <button className="text-xs font-medium text-neutral-600 hover:text-neutral-900">Usar precios sugeridos</button>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}
