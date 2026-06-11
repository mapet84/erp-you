import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { CatalogForm } from "@/components/erp/catalog-form";
import { DeleteButton } from "@/components/erp/delete-button";
import { crearMedioCompra, borrarMedioCompra } from "../actions";

export default async function MediosCompraPage() {
  const user = await requireCan("GESTION", "configure");
  const medios = await prisma.medioCompra.findMany({ orderBy: { nombre: "asc" } });
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-xl font-semibold text-neutral-900">Medios de compra</h1>
      <CatalogForm
        action={crearMedioCompra}
        campos={[
          { name: "nombre", label: "Nombre", required: true },
          { name: "diasCredito", label: "Días crédito", type: "number", width: "w-28", defaultValue: "0" },
        ]}
      />
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500"><tr><th className="px-4 py-2 font-medium">Nombre</th><th className="px-4 py-2 font-medium">Días crédito</th><th className="px-4 py-2" /></tr></thead>
          <tbody>
            {medios.map((m) => (
              <tr key={m.id} className="border-t border-neutral-100">
                <td className="px-4 py-2 text-neutral-800">{m.nombre}</td>
                <td className="px-4 py-2 text-neutral-500">{m.diasCredito}</td>
                <td className="px-4 py-2 text-right">{user.esAdmin && <DeleteButton action={borrarMedioCompra} id={m.id} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
