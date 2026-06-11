import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { TiendaForm } from "@/app/(erp)/admin/tiendas/tienda-form";
import { toggleTienda } from "@/app/(erp)/admin/tiendas/actions";

export default async function TiendasCfgPage() {
  await requireCan("GESTION", "configure");
  const tiendas = await prisma.tienda.findMany({ orderBy: { codigo: "asc" } });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Tiendas</h1>
        <p className="mt-1 text-sm text-neutral-500">Sucursales de la empresa. (El alta/baja requiere rol de administrador.)</p>
      </div>
      <TiendaForm />
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500"><tr><th className="px-4 py-2 font-medium">Código</th><th className="px-4 py-2 font-medium">Nombre</th><th className="px-4 py-2 font-medium">Estado</th><th className="px-4 py-2" /></tr></thead>
          <tbody>
            {tiendas.map((t) => (
              <tr key={t.id} className="border-t border-neutral-100">
                <td className="px-4 py-2 font-mono text-neutral-800">{t.codigo}</td>
                <td className="px-4 py-2 text-neutral-800">{t.nombre}</td>
                <td className="px-4 py-2"><span className={t.activo ? "rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700" : "rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500"}>{t.activo ? "Activa" : "Inactiva"}</span></td>
                <td className="px-4 py-2 text-right"><form action={toggleTienda}><input type="hidden" name="id" value={t.id} /><button className="text-xs text-neutral-500 hover:text-neutral-900">{t.activo ? "Desactivar" : "Activar"}</button></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
