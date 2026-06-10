// Placeholder de módulo: la ruta existe y está protegida por permisos desde la
// rebanada #2; el contenido real llega en la rebanada de cada módulo.
export function ModuloProximamente({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion: string;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-neutral-900">{titulo}</h1>
      <p className="mt-1 text-sm text-neutral-500">{descripcion}</p>
      <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-400">
        Tienes acceso a este módulo. La funcionalidad se habilita en su rebanada.
      </div>
    </div>
  );
}
