import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { costoComponente, costoReceta } from "@/lib/erp/costeo";
import { precioDesdeMargen } from "@/lib/erp/pricing";
import { formatMXN, formatPct } from "@/lib/erp/money";

export default async function RecetaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCan("GESTION", "read");
  const { id } = await params;

  const receta = await prisma.receta.findUnique({
    where: { id },
    include: {
      categoria: true,
      componentes: { include: { ingrediente: { include: { unidad: true } } } },
    },
  });
  if (!receta) notFound();

  // Costo de compra (general) calculado en vivo desde el costo de los ingredientes.
  const lineas = receta.componentes.map((c) => ({
    nombre: c.ingrediente.nombre,
    unidad: c.ingrediente.unidad.codigo,
    cantidad: c.cantidad.toString(),
    rendimiento: c.rendimiento.toString(),
    costo: costoComponente({
      costoUnitario: c.ingrediente.costoCompra,
      cantidad: c.cantidad,
      rendimiento: c.rendimiento,
    }),
  }));
  const costoTotal = costoReceta(
    receta.componentes.map((c) => ({
      costoUnitario: c.ingrediente.costoCompra,
      cantidad: c.cantidad,
      rendimiento: c.rendimiento,
    })),
  );

  // Precio sugerido por canal = costo + margen objetivo (categoría, canal).
  const [canales, margenes] = await Promise.all([
    prisma.canal.findMany({ orderBy: { nombre: "asc" } }),
    prisma.margenObjetivo.findMany({ where: { categoriaId: receta.categoriaId } }),
  ]);
  const margenPorCanal = new Map(margenes.map((m) => [m.canalId, m.margen]));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/gestion/recetas" className="text-sm text-neutral-500 hover:text-neutral-800">← Recetas</Link>
        <h1 className="mt-1 text-xl font-semibold text-neutral-900">
          <span className="font-mono text-neutral-500">{receta.sku}</span> · {receta.nombre}
        </h1>
        <p className="text-sm text-neutral-500">{receta.categoria.nombre}</p>
      </div>

      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Ingrediente</th>
              <th className="px-4 py-2 font-medium">Cantidad</th>
              <th className="px-4 py-2 font-medium">Rend.</th>
              <th className="px-4 py-2 font-medium text-right">Costo</th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((l, k) => (
              <tr key={k} className="border-t border-neutral-100">
                <td className="px-4 py-2 text-neutral-800">{l.nombre}</td>
                <td className="px-4 py-2 text-neutral-500">{l.cantidad} {l.unidad}</td>
                <td className="px-4 py-2 text-neutral-500">{formatPct(l.rendimiento)}</td>
                <td className="px-4 py-2 text-right text-neutral-800">{formatMXN(l.costo)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-neutral-200 font-medium">
              <td className="px-4 py-2 text-neutral-900" colSpan={3}>Costo de compra total</td>
              <td className="px-4 py-2 text-right text-neutral-900">{formatMXN(costoTotal)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-800">Precio de venta sugerido por canal</h2>
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Canal</th>
                <th className="px-4 py-2 font-medium">Margen obj.</th>
                <th className="px-4 py-2 font-medium text-right">Precio sugerido (c/IVA)</th>
              </tr>
            </thead>
            <tbody>
              {canales.map((can) => {
                const m = margenPorCanal.get(can.id);
                return (
                  <tr key={can.id} className="border-t border-neutral-100">
                    <td className="px-4 py-2 text-neutral-800">{can.nombre}</td>
                    <td className="px-4 py-2 text-neutral-500">{m ? formatPct(m) : "—"}</td>
                    <td className="px-4 py-2 text-right text-neutral-800">
                      {m ? formatMXN(precioDesdeMargen(costoTotal, m)) : (
                        <Link href="/gestion/margenes" className="text-xs text-neutral-400 hover:text-neutral-700">
                          configura margen
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
