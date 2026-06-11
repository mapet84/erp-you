import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { EditarIngredienteForm } from "./editar-form";

export default async function EditarIngredientePage({ params }: { params: Promise<{ id: string }> }) {
  await requireCan("GESTION", "configure");
  const { id } = await params;
  const [ingrediente, unidades] = await Promise.all([
    prisma.ingrediente.findUnique({ where: { id } }),
    prisma.unidad.findMany({ orderBy: { codigo: "asc" } }),
  ]);
  if (!ingrediente) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Editar ingrediente</h1>
      <EditarIngredienteForm
        ingrediente={{ id: ingrediente.id, codigo: ingrediente.codigo, nombre: ingrediente.nombre, unidadId: ingrediente.unidadId, costoCompra: ingrediente.costoCompra.toString(), minCompra: ingrediente.minCompra.toString() }}
        unidades={unidades.map((u) => ({ id: u.id, codigo: u.codigo }))}
      />
    </div>
  );
}
