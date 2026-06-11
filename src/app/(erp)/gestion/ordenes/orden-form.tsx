"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { crearOrden, type OrdenState } from "./actions";
import { ComboBox } from "@/components/erp/combobox";

const initial: OrdenState = {};
const inputCls = "rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400";

interface Item { id: string; codigo: string; nombre: string }
interface Props {
  clientes: { id: string; nombre: string }[];
  tiendas: { id: string; codigo: string }[];
  recetas: Item[];
  productos: Item[];
}

function Row({ recetas, productos }: { recetas: Item[]; productos: Item[] }) {
  const [tipo, setTipo] = useState<"receta" | "producto">("receta");
  const items = tipo === "receta" ? recetas : productos;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select name="comp_tipo" value={tipo} onChange={(e) => setTipo(e.target.value as "receta" | "producto")} className={inputCls}>
        <option value="receta">Receta</option>
        <option value="producto">Producto</option>
      </select>
      <div className="min-w-48 flex-1">
        <ComboBox key={tipo} name="comp_refId" options={items.map((i) => ({ value: i.id, label: i.nombre, codigo: i.codigo }))} />
      </div>
      <input name="comp_qty" inputMode="decimal" placeholder="cant." className={`w-24 ${inputCls}`} />
      <input name="comp_precio" inputMode="decimal" placeholder="precio" className={`w-28 ${inputCls}`} />
    </div>
  );
}

export function OrdenForm({ clientes, tiendas, recetas, productos }: Props) {
  const [state, action, pending] = useActionState(crearOrden, initial);
  const [filas, setFilas] = useState([0]);
  const router = useRouter();
  useEffect(() => {
    if (state.ok && state.ordenId) router.push(`/gestion/ordenes/${state.ordenId}`);
  }, [state.ok, state.ordenId, router]);

  return (
    <form action={action} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs text-neutral-500">Cliente</label>
          <select name="clienteId" required className={`mt-1 w-full ${inputCls}`}>
            <option value="">— elegir —</option>
            {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-500">Tienda</label>
          <select name="tiendaId" required className={`mt-1 ${inputCls}`}>
            {tiendas.map((t) => (<option key={t.id} value={t.id}>{t.codigo}</option>))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-neutral-500">Renglones</p>
        {filas.map((f) => (<Row key={f} recetas={recetas} productos={productos} />))}
        <button type="button" onClick={() => setFilas((x) => [...x, (x.at(-1) ?? 0) + 1])} className="text-xs font-medium text-neutral-600 hover:text-neutral-900">+ Agregar renglón</button>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">{pending ? "Creando…" : "Crear orden"}</button>
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
