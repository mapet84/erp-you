"use client";

/// Barra de borrado masivo. Es un <form> con `id` que contiene solo el botón;
/// los checkboxes viven en la tabla y se asocian por el atributo `form={formId}`
/// (así no se anidan formularios). Confirma antes de enviar.
export function BulkDeleteBar({
  formId,
  action,
  label = "Eliminar seleccionados",
}: {
  formId: string;
  action: (fd: FormData) => Promise<void>;
  label?: string;
}) {
  return (
    <form
      id={formId}
      action={action}
      onSubmit={(e) => {
        const n = document.querySelectorAll(`input[name="ids"][form="${formId}"]:checked`).length;
        if (n === 0) { e.preventDefault(); return; }
        if (!window.confirm(`¿Eliminar ${n} seleccionado(s)? No se puede deshacer.`)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        {label}
      </button>
    </form>
  );
}
