import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { ClienteForm } from "./cliente-form";

export default async function ClientesPage() {
  const user = await requireCan("GESTION", "read");
  const puedeEditar = user.esAdmin || user.roles.some((r) => r.modulo === "GESTION" && r.rol === "CONFIGURADOR");
  const clientes = await prisma.cliente.findMany({ orderBy: { nombre: "asc" } });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Clientes</h1>
        <p className="mt-1 text-sm text-neutral-500">Clientes para órdenes de venta (pedidos).</p>
      </div>

      {puedeEditar && <ClienteForm />}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">RFC</th>
              <th className="px-4 py-2 font-medium">Contacto</th>
              <th className="px-4 py-2 font-medium">Días pago</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-neutral-400">Aún no hay clientes.</td></tr>
            )}
            {clientes.map((c) => (
              <tr key={c.id} className="border-t border-neutral-100">
                <td className="px-4 py-2 text-neutral-800">{c.nombre}</td>
                <td className="px-4 py-2 font-mono text-neutral-500">{c.rfc ?? "—"}</td>
                <td className="px-4 py-2 text-neutral-500">{c.telefono ?? c.correos[0] ?? "—"}</td>
                <td className="px-4 py-2 text-neutral-500">{c.diasPago ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
