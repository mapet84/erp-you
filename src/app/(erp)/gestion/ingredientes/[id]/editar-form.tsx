"use client";

import Link from "next/link";
import { useActionState } from "react";
import { editarIngrediente, type IngredienteState } from "../actions";

const initial: IngredienteState = {};
const inputCls = "mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400";

interface Props {
  ingrediente: { id: string; codigo: string; nombre: string; unidadId: string; costoCompra: string; minCompra: string };
  unidades: { id: string; codigo: string }[];
}

export function EditarIngredienteForm({ ingrediente, unidades }: Props) {
  const [state, action, pending] = useActionState(editarIngrediente, initial);
  return (
    <form action={action} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4">
      <input type="hidden" name="id" value={ingrediente.id} />
      <p className="text-sm text-neutral-500">Código <span className="font-mono text-neutral-700">{ingrediente.codigo}</span> (no cambia)</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><label className="block text-xs text-neutral-500">Nombre</label><input name="nombre" defaultValue={ingrediente.nombre} required className={inputCls} /></div>
        <div>
          <label className="block text-xs text-neutral-500">Unidad</label>
          <select name="unidadId" defaultValue={ingrediente.unidadId} required className={inputCls}>
            {unidades.map((u) => (<option key={u.id} value={u.id}>{u.codigo}</option>))}
          </select>
        </div>
        <div><label className="block text-xs text-neutral-500">Costo compra</label><input name="costoCompra" defaultValue={ingrediente.costoCompra} inputMode="decimal" required className={inputCls} /></div>
        <div><label className="block text-xs text-neutral-500">Mín. compra</label><input name="minCompra" defaultValue={ingrediente.minCompra} inputMode="decimal" className={inputCls} /></div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">{pending ? "Guardando…" : "Guardar"}</button>
        <Link href="/gestion/ingredientes" className="text-sm text-neutral-500 hover:text-neutral-800">Volver</Link>
        {state.ok && <span className="text-sm text-green-600">Guardado ✓</span>}
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
