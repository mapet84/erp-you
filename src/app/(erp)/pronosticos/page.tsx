import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { can } from "@/lib/erp/rbac";
import { correrPronostico } from "./actions";

const inputCls = "rounded-md border border-neutral-300 px-2 py-1.5 text-sm";

export default async function PronosticosPage() {
  const user = await requireCan("PRONOSTICOS", "read");
  const puede = can(user, "PRONOSTICOS", "write");

  const [tiendas, pronosticos] = await Promise.all([
    prisma.tienda.findMany({ where: { activo: true, ...(user.esAdmin ? {} : { id: { in: [...user.tiendas] } }) }, orderBy: { codigo: "asc" } }),
    prisma.pronostico.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { _count: { select: { lineas: true, compras: true } } } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Pronósticos</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Proyecta ventas por artículo y la lista de compras (explosión de ingredientes) por tienda.
        </p>
      </div>

      {puede && (
        <form action={correrPronostico} className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4">
          <div>
            <label className="block text-xs text-neutral-500">Tienda</label>
            <select name="tiendaId" required className={`mt-1 ${inputCls}`}>
              {tiendas.map((t) => (<option key={t.id} value={t.id}>{t.codigo}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-neutral-500">Método</label>
            <select name="metodo" className={`mt-1 ${inputCls}`} defaultValue="lineal">
              <option value="lineal">Lineal</option>
              <option value="exponencial">Exponencial</option>
              <option value="plano">Plano</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-neutral-500">Semanas historia</label>
            <input name="semanasHistoria" inputMode="numeric" defaultValue="12" className={`mt-1 w-20 ${inputCls}`} />
          </div>
          <div>
            <label className="block text-xs text-neutral-500">Horizonte (sem)</label>
            <input name="horizonte" inputMode="numeric" defaultValue="4" className={`mt-1 w-20 ${inputCls}`} />
          </div>
          <div>
            <label className="block text-xs text-neutral-500">Crecimiento</label>
            <input name="crecimiento" inputMode="decimal" defaultValue="1" className={`mt-1 w-20 ${inputCls}`} />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-neutral-700">
            <input type="checkbox" name="usaTendencia" /> Tendencia
          </label>
          <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">Correr pronóstico</button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Fecha</th>
              <th className="px-4 py-2 font-medium">Método</th>
              <th className="px-4 py-2 font-medium">Horizonte</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {pronosticos.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-400">Sin pronósticos. Corre uno.</td></tr>
            )}
            {pronosticos.map((p) => (
              <tr key={p.id} className="border-t border-neutral-100">
                <td className="px-4 py-2 text-neutral-500">{p.createdAt.toISOString().slice(0, 10)}</td>
                <td className="px-4 py-2 text-neutral-500">{p.metodo}</td>
                <td className="px-4 py-2 text-neutral-500">{p.horizonteSemanas} sem</td>
                <td className="px-4 py-2">
                  <span className={p.estado === "CONFIRMADO" ? "rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700" : "rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700"}>{p.estado}</span>
                </td>
                <td className="px-4 py-2 text-right"><Link href={`/pronosticos/${p.id}`} className="text-xs font-medium text-neutral-600 hover:text-neutral-900">Ver</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
