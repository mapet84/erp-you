"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { crearSemiTerminado, type SemiState } from "./actions";

const initial: SemiState = {};
const inputCls =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400";

interface Item { id: string; codigo: string; nombre: string }

function ComponenteRow({ ingredientes, semis }: { ingredientes: Item[]; semis: Item[] }) {
  const [tipo, setTipo] = useState<"ing" | "semi">("ing");
  const items = tipo === "ing" ? ingredientes : semis;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select name="comp_tipo" value={tipo} onChange={(e) => setTipo(e.target.value as "ing" | "semi")} className={inputCls}>
        <option value="ing">Ingrediente</option>
        <option value="semi">Semi-terminado</option>
      </select>
      <select name="comp_refId" className={`${inputCls} flex-1`}>
        <option value="">— elegir —</option>
        {items.map((i) => (<option key={i.id} value={i.id}>{i.codigo} · {i.nombre}</option>))}
      </select>
      <input name="comp_cantidad" inputMode="decimal" placeholder="cantidad" className={`w-28 ${inputCls}`} />
      <input name="comp_rendimiento" inputMode="decimal" defaultValue="100" title="rendimiento %" className={`w-20 ${inputCls}`} />
      <span className="text-xs text-neutral-400">% rend.</span>
    </div>
  );
}

export function SemiForm({ ingredientes, semis }: { ingredientes: Item[]; semis: Item[] }) {
  const [state, action, pending] = useActionState(crearSemiTerminado, initial);
  const [filas, setFilas] = useState([0]);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-neutral-500">SKU</label>
          <input name="sku" required className={`mt-1 w-32 ${inputCls}`} />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-neutral-500">Nombre</label>
          <input name="nombre" required className={`mt-1 w-full ${inputCls}`} />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-neutral-500">Componentes</p>
        {filas.map((f) => (<ComponenteRow key={f} ingredientes={ingredientes} semis={semis} />))}
        <button type="button" onClick={() => setFilas((f) => [...f, (f.at(-1) ?? 0) + 1])} className="text-xs font-medium text-neutral-600 hover:text-neutral-900">
          + Agregar componente
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">
          {pending ? "Creando…" : "Crear semi-terminado"}
        </button>
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
        {state.ok && <span className="text-sm text-green-600">Creado ✓</span>}
      </div>
    </form>
  );
}
