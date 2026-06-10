"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearCliente, type ClienteState } from "./actions";

const initial: ClienteState = {};
const inputCls = "rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400";

export function ClienteForm() {
  const [state, action, pending] = useActionState(crearCliente, initial);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-2">
      <div><label className="block text-xs text-neutral-500">Nombre</label><input name="nombre" required className={`mt-1 w-full ${inputCls}`} /></div>
      <div><label className="block text-xs text-neutral-500">RFC</label><input name="rfc" className={`mt-1 w-full ${inputCls}`} /></div>
      <div><label className="block text-xs text-neutral-500">Correos (separados por coma)</label><input name="correos" className={`mt-1 w-full ${inputCls}`} /></div>
      <div><label className="block text-xs text-neutral-500">Teléfono</label><input name="telefono" className={`mt-1 w-full ${inputCls}`} /></div>
      <div><label className="block text-xs text-neutral-500">Días de pago</label><input name="diasPago" inputMode="numeric" className={`mt-1 w-full ${inputCls}`} /></div>
      <div><label className="block text-xs text-neutral-500">Dir. facturación</label><input name="dirFacturacion" className={`mt-1 w-full ${inputCls}`} /></div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">{pending ? "…" : "Agregar cliente"}</button>
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
        {state.ok && <span className="text-sm text-green-600">Cliente agregado ✓</span>}
      </div>
    </form>
  );
}
