"use client";

import { useActionState, useEffect, useRef } from "react";

export interface CatalogState {
  ok?: boolean;
  error?: string;
}

export interface CampoCatalogo {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  width?: string;
  defaultValue?: string;
  options?: { value: string; label: string }[];
}

const inputCls =
  "mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400";

/// Formulario genérico de alta de catálogo: una fila de campos + botón. Resetea
/// al guardar. La acción recibe FormData con los `name` de cada campo.
export function CatalogForm({
  action,
  campos,
  submitLabel = "Agregar",
}: {
  action: (prev: CatalogState, fd: FormData) => Promise<CatalogState>;
  campos: CampoCatalogo[];
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={formAction} className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4">
      {campos.map((c) => (
        <div key={c.name} className={c.width ?? "flex-1 min-w-32"}>
          <label className="block text-xs text-neutral-500">{c.label}</label>
          {c.options ? (
            <select name={c.name} required={c.required} defaultValue={c.defaultValue} className={inputCls}>
              {!c.required && <option value="">—</option>}
              {c.options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          ) : (
            <input name={c.name} type={c.type ?? "text"} required={c.required} defaultValue={c.defaultValue} inputMode={c.type === "number" ? "decimal" : undefined} className={inputCls} />
          )}
        </div>
      ))}
      <button type="submit" disabled={pending} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">
        {pending ? "…" : submitLabel}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="w-full text-sm text-green-600">Guardado ✓</p>}
    </form>
  );
}
