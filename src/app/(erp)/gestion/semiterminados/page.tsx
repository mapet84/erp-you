import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { DeleteButton } from "@/components/erp/delete-button";
import { SemiForm } from "./semi-form";
import { borrarSemiTerminado } from "./actions";

export default async function SemiTerminadosPage() {
  const user = await requireCan("GESTION", "read");
  const puedeEditar = user.esAdmin || user.roles.some((r) => r.modulo === "GESTION" && r.rol === "CONFIGURADOR");
  const puedeBorrar = user.esAdmin;

  const [semis, ingredientes] = await Promise.all([
    prisma.semiTerminado.findMany({
      orderBy: { sku: "asc" },
      include: { _count: { select: { componentes: true } } },
    }),
    prisma.ingrediente.findMany({ orderBy: { codigo: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Semi-terminados</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Preparaciones reutilizables y componibles (incluso anidadas) dentro de recetas.
        </p>
      </div>

      {puedeEditar && ingredientes.length > 0 && (
        <SemiForm
          ingredientes={ingredientes.map((i) => ({ id: i.id, codigo: i.codigo, nombre: i.nombre }))}
          semis={semis.map((s) => ({ id: s.id, codigo: s.sku, nombre: s.nombre }))}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">SKU</th>
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">Componentes</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {semis.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-neutral-400">Aún no hay semi-terminados.</td></tr>
            )}
            {semis.map((s) => (
              <tr key={s.id} className="border-t border-neutral-100">
                <td className="px-4 py-2 font-mono text-neutral-800">{s.sku}</td>
                <td className="px-4 py-2 text-neutral-800">{s.nombre}</td>
                <td className="px-4 py-2 text-neutral-500">{s._count.componentes}</td>
                <td className="px-4 py-2 text-right">{puedeBorrar && <DeleteButton action={borrarSemiTerminado} id={s.id} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
