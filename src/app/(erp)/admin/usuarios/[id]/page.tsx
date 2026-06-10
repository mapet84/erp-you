import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/erp/session.server";
import { EditarUsuarioForm } from "./editar-usuario-form";

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [user, tiendas] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: { moduleRoles: true, stores: true },
    }),
    prisma.tienda.findMany({ where: { activo: true }, orderBy: { codigo: "asc" } }),
  ]);
  if (!user) notFound();

  const roles: Record<string, string> = {};
  for (const r of user.moduleRoles) roles[r.modulo] = r.rol;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Editar usuario</h1>
        <p className="mt-1 text-sm text-neutral-500">{user.email}</p>
      </div>
      <EditarUsuarioForm
        user={{
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          esAdmin: user.esAdmin,
          activo: user.activo,
          roles,
          tiendaIds: user.stores.map((s) => s.tiendaId),
        }}
        tiendas={tiendas.map((t) => ({ id: t.id, codigo: t.codigo, nombre: t.nombre }))}
      />
    </div>
  );
}
