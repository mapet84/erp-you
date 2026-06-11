"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearProducto, type ProductoState } from "./actions";

const initial: ProductoState = {};
const inputCls =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400";

interface Opt { id: string; nombre: string }

export function ProductoForm({ categorias, unidades }: { categorias: Opt[]; unidades: { id: string; codigo: string }[] }) {
  const [state, action, pending] = useActionState(crearProducto, initial);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex-1">
        <label className="block text-xs text-neutral-500">Descripción</label>
        <input name="descripcion" required className={`mt-1 w-full ${inputCls}`} />
        <p className="mt-1 text-xs text-neutral-400">El código se asigna automático (categoría+consecutivo).</p>
      </div>
      <div>
        <label className="block text-xs text-neutral-500">Categoría</label>
        <select name="categoriaId" required className={`mt-1 ${inputCls}`}>
          {categorias.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-neutral-500">Unidad</label>
        <select name="unidadId" required className={`mt-1 ${inputCls}`}>
          {unidades.map((u) => (<option key={u.id} value={u.id}>{u.codigo}</option>))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-neutral-500">Costo</label>
        <input name="costo" inputMode="decimal" defaultValue="0" className={`mt-1 w-24 ${inputCls}`} />
      </div>
      <button type="submit" disabled={pending} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">
        {pending ? "…" : "Agregar"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
