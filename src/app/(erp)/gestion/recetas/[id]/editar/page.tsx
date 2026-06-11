import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";
import { EditarRecetaForm } from "./editar-receta-form";

export default async function EditarRecetaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCan("GESTION", "configure");
  const { id } = await params;
  const [receta, categorias, tamanos, ingredientes, semis] = await Promise.all([
    prisma.receta.findUnique({ where: { id }, include: { componentes: true } }),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
    prisma.tamano.findMany({ orderBy: { nombre: "asc" } }),
    prisma.ingrediente.findMany({ orderBy: { codigo: "asc" } }),
    prisma.semiTerminado.findMany({ orderBy: { sku: "asc" } }),
  ]);
  if (!receta) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Editar receta <span className="font-mono text-neutral-500">{receta.sku}</span></h1>
      <EditarRecetaForm
        receta={{
          id: receta.id,
          nombre: receta.nombre,
          categoriaId: receta.categoriaId,
          tamanoId: receta.tamanoId,
          componentes: receta.componentes.map((c) => ({
            tipo: c.ingredienteId ? "ing" : "semi",
            refId: c.ingredienteId ?? c.semiTerminadoId ?? "",
            cantidad: c.cantidad.toString(),
            rendimiento: c.rendimiento.toString(),
          })),
        }}
        categorias={categorias.map((c) => ({ id: c.id, nombre: c.nombre }))}
        tamanos={tamanos.map((t) => ({ id: t.id, nombre: t.nombre }))}
        ingredientes={ingredientes.map((i) => ({ id: i.id, codigo: i.codigo, nombre: i.nombre }))}
        semis={semis.map((s) => ({ id: s.id, codigo: s.sku, nombre: s.nombre }))}
      />
    </div>
  );
}
