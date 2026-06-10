"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearTienda, type TiendaState } from "./actions";

const initial: TiendaState = {};
const inputCls =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400";

export function TiendaForm() {
  const [state, action, pending] = useActionState(crearTienda, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4"
    >
      <div>
        <label className="block text-xs text-neutral-500">Código</label>
        <input name="codigo" required className={`mt-1 w-28 ${inputCls}`} />
      </div>
      <div className="flex-1">
        <label className="block text-xs text-neutral-500">Nombre</label>
        <input name="nombre" required className={`mt-1 ${inputCls}`} />
      </div>
      <div className="flex-1">
        <label className="block text-xs text-neutral-500">Dirección (opcional)</label>
        <input name="direccion" className={`mt-1 ${inputCls}`} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Agregar tienda"}
      </button>
      {state.error && (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
