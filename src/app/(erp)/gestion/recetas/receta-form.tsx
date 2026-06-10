"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { crearReceta, type RecetaState } from "./actions";

const initial: RecetaState = {};
const inputCls =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400";

interface Props {
  categorias: { id: string; nombre: string }[];
  ingredientes: { id: string; codigo: string; nombre: string }[];
}

export function RecetaForm({ categorias, ingredientes }: Props) {
  const [state, action, pending] = useActionState(crearReceta, initial);
  const [filas, setFilas] = useState([0]);
  const router = useRouter();

  useEffect(() => {
    if (state.ok && state.recetaId) router.push(`/gestion/recetas/${state.recetaId}`);
  }, [state.ok, state.recetaId, router]);

  return (
    <form action={action} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-neutral-500">SKU</label>
          <input name="sku" required className={`mt-1 w-32 ${inputCls}`} />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-neutral-500">Nombre</label>
          <input name="nombre" required className={`mt-1 w-full ${inputCls}`} />
        </div>
        <div>
          <label className="block text-xs text-neutral-500">Categoría</label>
          <select name="categoriaId" required className={`mt-1 ${inputCls}`}>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-neutral-500">Componentes</p>
        {filas.map((fila) => (
          <div key={fila} className="flex flex-wrap items-center gap-2">
            <select name="comp_ingredienteId" className={`${inputCls} flex-1`}>
              <option value="">— ingrediente —</option>
              {ingredientes.map((i) => (
                <option key={i.id} value={i.id}>{i.codigo} · {i.nombre}</option>
              ))}
            </select>
            <input name="comp_cantidad" inputMode="decimal" placeholder="cantidad" className={`w-28 ${inputCls}`} />
            <input name="comp_rendimiento" inputMode="decimal" defaultValue="100" title="rendimiento %" className={`w-24 ${inputCls}`} />
            <span className="text-xs text-neutral-400">% rend.</span>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setFilas((f) => [...f, (f.at(-1) ?? 0) + 1])}
          className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
        >
          + Agregar componente
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">
          {pending ? "Creando…" : "Crear receta"}
        </button>
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
