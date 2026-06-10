import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/erp/session.server";
import { NuevoUsuarioForm } from "./usuario-form";

export default async function UsuariosPage() {
  await requireAdmin();
  const usuarios = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { moduleRoles: true, stores: true },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Usuarios</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Directorio único. Cada usuario tiene un rol por módulo y un alcance por
          tienda.
        </p>
      </div>

      <NuevoUsuarioForm />

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Usuario</th>
              <th className="px-4 py-2 font-medium">Módulos / roles</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-neutral-100 align-top">
                <td className="px-4 py-2">
                  <div className="font-medium text-neutral-800">{u.nombre}</div>
                  <div className="text-xs text-neutral-500">{u.email}</div>
                  {u.esAdmin && (
                    <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                      Admin
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-neutral-600">
                  {u.esAdmin ? (
                    <span className="text-neutral-400">Acceso total</span>
                  ) : u.moduleRoles.length === 0 ? (
                    <span className="text-neutral-400">Sin módulos</span>
                  ) : (
                    <ul className="space-y-0.5">
                      {u.moduleRoles.map((r) => (
                        <li key={r.modulo}>
                          {r.modulo} · <span className="text-neutral-500">{r.rol}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-1 text-neutral-400">
                    {u.stores.length === 0 ? "Todas las tiendas" : `${u.stores.length} tienda(s)`}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={
                      u.activo
                        ? "rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700"
                        : "rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500"
                    }
                  >
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/admin/usuarios/${u.id}`}
                    className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
