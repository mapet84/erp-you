"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearGasto, type GastoState } from "./actions";

const initial: GastoState = {};
const inputCls = "rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400";

interface Props {
  categorias: { id: string; nombre: string }[];
  tiendas: { id: string; codigo: string }[];
}

export function GastoForm({ categorias, tiendas }: Props) {
  const [state, action, pending] = useActionState(crearGasto, initial);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4">
      <div>
        <label className="block text-xs text-neutral-500">Fecha</label>
        <input name="fecha" type="date" className={`mt-1 ${inputCls}`} />
      </div>
      <div>
        <label className="block text-xs text-neutral-500">Categoría</label>
        <select name="categoriaGastoId" required className={`mt-1 ${inputCls}`}>
          {categorias.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-xs text-neutral-500">Descripción</label>
        <input name="descripcion" required className={`mt-1 w-full ${inputCls}`} />
      </div>
      <div>
        <label className="block text-xs text-neutral-500">Monto</label>
        <input name="monto" inputMode="decimal" required className={`mt-1 w-28 ${inputCls}`} />
      </div>
      <div>
        <label className="block text-xs text-neutral-500">Tienda</label>
        <select name="tiendaId" className={`mt-1 ${inputCls}`}>
          <option value="">General</option>
          {tiendas.map((t) => (<option key={t.id} value={t.id}>{t.codigo}</option>))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-neutral-500">Periodicidad</label>
        <select name="periodicidad" className={`mt-1 ${inputCls}`} defaultValue="UNICA">
          {["UNICA", "QUINCENAL", "MENSUAL", "BIMESTRAL", "SEMESTRAL", "ANUAL"].map((p) => (<option key={p} value={p}>{p}</option>))}
        </select>
      </div>
      <button type="submit" disabled={pending} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">{pending ? "…" : "Registrar gasto"}</button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
