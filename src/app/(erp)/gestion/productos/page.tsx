import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { formatMXN } from "@/lib/erp/money";
import { ProductoForm } from "./producto-form";
import { guardarPrecioProducto } from "./actions";

export default async function ProductosPage() {
  const user = await requireCan("GESTION", "read");
  const puedeEditar = user.esAdmin || user.roles.some((r) => r.modulo === "GESTION" && r.rol === "CONFIGURADOR");

  const [productos, categorias, unidades, canales] = await Promise.all([
    prisma.producto.findMany({ orderBy: { codigo: "asc" }, include: { categoria: true, unidad: true, precios: true } }),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
    prisma.unidad.findMany({ orderBy: { codigo: "asc" } }),
    prisma.canal.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Productos</h1>
        <p className="mt-1 text-sm text-neutral-500">Artículos no-receta, con precio por canal.</p>
      </div>

      {puedeEditar && (
        <ProductoForm
          categorias={categorias.map((c) => ({ id: c.id, nombre: c.nombre }))}
          unidades={unidades.map((u) => ({ id: u.id, codigo: u.codigo }))}
        />
      )}

      <div className="space-y-4">
        {productos.length === 0 && <p className="text-sm text-neutral-400">Aún no hay productos.</p>}
        {productos.map((p) => {
          const precioPorCanal = new Map(p.precios.map((pr) => [pr.canalId, pr.precio.toString()]));
          return (
            <div key={p.id} className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-neutral-500">{p.codigo}</span>{" "}
                  <span className="font-medium text-neutral-900">{p.descripcion}</span>
                  <span className="ml-2 text-xs text-neutral-400">{p.categoria.nombre} · {p.unidad.codigo}</span>
                </div>
                <span className="text-sm text-neutral-500">Costo {formatMXN(p.costo.toString())}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-4">
                {canales.map((can) => (
                  <form key={can.id} action={guardarPrecioProducto} className="flex items-end gap-2">
                    <input type="hidden" name="productoId" value={p.id} />
                    <input type="hidden" name="canalId" value={can.id} />
                    <div>
                      <label className="block text-xs text-neutral-500">{can.nombre} (c/IVA)</label>
                      <input
                        name="precio"
                        inputMode="decimal"
                        defaultValue={precioPorCanal.get(can.id) ?? ""}
                        disabled={!puedeEditar}
                        className="mt-1 w-28 rounded-md border border-neutral-300 px-2 py-1 text-sm"
                      />
                    </div>
                    {puedeEditar && <button type="submit" className="pb-1 text-xs text-neutral-500 hover:text-neutral-900">Guardar</button>}
                  </form>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
