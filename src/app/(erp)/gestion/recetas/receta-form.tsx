"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { crearReceta, type RecetaState } from "./actions";
import { ComboBox } from "@/components/erp/combobox";

const initial: RecetaState = {};
const inputCls =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400";

interface Item { id: string; codigo: string; nombre: string }
interface Props {
  categorias: { id: string; nombre: string }[];
  tamanos: { id: string; nombre: string }[];
  ingredientes: Item[];
  semis: Item[];
}

function ComponenteRow({ ingredientes, semis }: { ingredientes: Item[]; semis: Item[] }) {
  const [tipo, setTipo] = useState<"ing" | "semi">("ing");
  const items = tipo === "ing" ? ingredientes : semis;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        name="comp_tipo"
        value={tipo}
        onChange={(e) => setTipo(e.target.value as "ing" | "semi")}
        className={inputCls}
      >
        <option value="ing">Ingrediente</option>
        <option value="semi">Semi-terminado</option>
      </select>
      <div className="min-w-48 flex-1">
        <ComboBox key={tipo} name="comp_refId" options={items.map((i) => ({ value: i.id, label: i.nombre, codigo: i.codigo }))} />
      </div>
      <input name="comp_cantidad" inputMode="decimal" placeholder="cantidad" className={`w-28 ${inputCls}`} />
      <input name="comp_rendimiento" inputMode="decimal" defaultValue="100" title="rendimiento %" className={`w-20 ${inputCls}`} />
      <span className="text-xs text-neutral-400">% rend.</span>
    </div>
  );
}

export function RecetaForm({ categorias, tamanos, ingredientes, semis }: Props) {
  const [state, action, pending] = useActionState(crearReceta, initial);
  const [filas, setFilas] = useState([0]);
  const router = useRouter();

  useEffect(() => {
    if (state.ok && state.recetaId) router.push(`/gestion/recetas/${state.recetaId}`);
  }, [state.ok, state.recetaId, router]);

  return (
    <form action={action} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs text-neutral-500">Nombre</label>
          <input name="nombre" required className={`mt-1 w-full ${inputCls}`} />
          <p className="mt-1 text-xs text-neutral-400">El SKU se asigna automático (categoría+tamaño+consecutivo).</p>
        </div>
        <div>
          <label className="block text-xs text-neutral-500">Categoría</label>
          <select name="categoriaId" required className={`mt-1 ${inputCls}`}>
            {categorias.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-500">Tamaño</label>
          <select name="tamanoId" className={`mt-1 ${inputCls}`}>
            <option value="">— sin tamaño —</option>
            {tamanos.map((t) => (<option key={t.id} value={t.id}>{t.nombre}</option>))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-neutral-500">Componentes</p>
        {filas.map((fila) => (
          <ComponenteRow key={fila} ingredientes={ingredientes} semis={semis} />
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
