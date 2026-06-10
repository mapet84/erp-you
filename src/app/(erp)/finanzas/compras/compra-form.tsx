"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { crearCompra, type CompraState } from "./actions";

const initial: CompraState = {};
const inputCls =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400";

interface Item { id: string; codigo: string; nombre: string }
interface Props {
  tiendas: { id: string; codigo: string; nombre: string }[];
  ingredientes: Item[];
  productos: Item[];
  medios: { id: string; nombre: string }[];
}

export function CompraForm({ tiendas, ingredientes, productos, medios }: Props) {
  const [state, action, pending] = useActionState(crearCompra, initial);
  const [tipo, setTipo] = useState<"INGREDIENTE" | "PRODUCTO">("INGREDIENTE");
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  const items = tipo === "PRODUCTO" ? productos : ingredientes;

  return (
    <form ref={ref} action={action} className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4">
      <div>
        <label className="block text-xs text-neutral-500">Tienda</label>
        <select name="tiendaId" required className={`mt-1 ${inputCls}`}>
          {tiendas.map((t) => (<option key={t.id} value={t.id}>{t.codigo}</option>))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-neutral-500">Tipo</label>
        <select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as "INGREDIENTE" | "PRODUCTO")} className={`mt-1 ${inputCls}`}>
          <option value="INGREDIENTE">Ingrediente</option>
          <option value="PRODUCTO">Producto</option>
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-xs text-neutral-500">Artículo</label>
        <select name="itemId" required className={`mt-1 w-full ${inputCls}`}>
          <option value="">— elegir —</option>
          {items.map((i) => (<option key={i.id} value={i.id}>{i.codigo} · {i.nombre}</option>))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-neutral-500">Cantidad</label>
        <input name="cantidad" inputMode="decimal" required className={`mt-1 w-24 ${inputCls}`} />
      </div>
      <div>
        <label className="block text-xs text-neutral-500">Costo unit.</label>
        <input name="costoUnitario" inputMode="decimal" required className={`mt-1 w-24 ${inputCls}`} />
      </div>
      <div>
        <label className="block text-xs text-neutral-500">Medio</label>
        <select name="medioCompraId" className={`mt-1 ${inputCls}`}>
          <option value="">—</option>
          {medios.map((m) => (<option key={m.id} value={m.id}>{m.nombre}</option>))}
        </select>
      </div>
      <button type="submit" disabled={pending} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">
        {pending ? "…" : "Registrar compra"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="w-full text-sm text-green-600">Compra registrada; CPM actualizado ✓</p>}
    </form>
  );
}
