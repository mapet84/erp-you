"use client";

/// Botón de borrar con confirmación. Recibe un server action (id en el form).
export function DeleteButton({
  action,
  id,
  label = "Eliminar",
  confirmar = "¿Eliminar este registro? No se puede deshacer.",
}: {
  action: (fd: FormData) => Promise<void>;
  id: string;
  label?: string;
  confirmar?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmar)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-xs font-medium text-red-500 hover:text-red-700">
        {label}
      </button>
    </form>
  );
}
