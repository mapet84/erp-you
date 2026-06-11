"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { editarReceta, type RecetaState } from "../../actions";
import { ComboBox } from "@/components/erp/combobox";

const initial: RecetaState = {};
const inputCls = "rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400";

interface Item { id: string; codigo: string; nombre: string }
interface CompInit { tipo: "ing" | "semi"; refId: string; cantidad: string; rendimiento: string }
interface Props {
  receta: { id: string; nombre: string; categoriaId: string; tamanoId: string | null; componentes: CompInit[] };
  categorias: { id: string; nombre: string }[];
  tamanos: { id: string; nombre: string }[];
  ingredientes: Item[];
  semis: Item[];
}

function Row({ ingredientes, semis, init }: { ingredientes: Item[]; semis: Item[]; init?: CompInit }) {
  const [tipo, setTipo] = useState<"ing" | "semi">(init?.tipo ?? "ing");
  const items = tipo === "ing" ? ingredientes : semis;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select name="comp_tipo" value={tipo} onChange={(e) => setTipo(e.target.value as "ing" | "semi")} className={inputCls}>
        <option value="ing">Ingrediente</option>
        <option value="semi">Semi-terminado</option>
      </select>
      <div className="min-w-48 flex-1">
        <ComboBox key={tipo} name="comp_refId" defaultValue={init && init.tipo === tipo ? init.refId : undefined} options={items.map((i) => ({ value: i.id, label: i.nombre, codigo: i.codigo }))} />
      </div>
      <input name="comp_cantidad" inputMode="decimal" defaultValue={init?.cantidad ?? ""} placeholder="cantidad" className={`w-28 ${inputCls}`} />
      <input name="comp_rendimiento" inputMode="decimal" defaultValue={init?.rendimiento ?? "100"} className={`w-20 ${inputCls}`} />
      <span className="text-xs text-neutral-400">% rend.</span>
    </div>
  );
}

export function EditarRecetaForm({ receta, categorias, tamanos, ingredientes, semis }: Props) {
  const [state, action, pending] = useActionState(editarReceta, initial);
  const [extra, setExtra] = useState<number[]>([]);
  const router = useRouter();
  useEffect(() => {
    if (state.ok) router.push(`/gestion/recetas/${receta.id}`);
  }, [state.ok, receta.id, router]);

  return (
    <form action={action} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4">
      <input type="hidden" name="id" value={receta.id} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs text-neutral-500">Nombre</label>
          <input name="nombre" defaultValue={receta.nombre} required className={`mt-1 w-full ${inputCls}`} />
        </div>
        <div>
          <label className="block text-xs text-neutral-500">Categoría</label>
          <select name="categoriaId" defaultValue={receta.categoriaId} required className={`mt-1 ${inputCls}`}>
            {categorias.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-500">Tamaño</label>
          <select name="tamanoId" defaultValue={receta.tamanoId ?? ""} className={`mt-1 ${inputCls}`}>
            <option value="">— sin tamaño —</option>
            {tamanos.map((t) => (<option key={t.id} value={t.id}>{t.nombre}</option>))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-neutral-500">Componentes</p>
        {receta.componentes.map((c, k) => (<Row key={`init-${k}`} ingredientes={ingredientes} semis={semis} init={c} />))}
        {extra.map((f) => (<Row key={`extra-${f}`} ingredientes={ingredientes} semis={semis} />))}
        <button type="button" onClick={() => setExtra((x) => [...x, (x.at(-1) ?? 0) + 1])} className="text-xs font-medium text-neutral-600 hover:text-neutral-900">+ Agregar componente</button>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">{pending ? "Guardando…" : "Guardar cambios"}</button>
        <Link href={`/gestion/recetas/${receta.id}`} className="text-sm text-neutral-500 hover:text-neutral-800">Cancelar</Link>
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
