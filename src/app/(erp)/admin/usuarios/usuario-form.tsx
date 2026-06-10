"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearUsuario, type UsuarioState } from "./actions";

const initial: UsuarioState = {};
const inputCls =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400";

export function NuevoUsuarioForm() {
  const [state, action, pending] = useActionState(crearUsuario, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4"
    >
      <h2 className="text-sm font-medium text-neutral-800">Nuevo usuario</h2>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs text-neutral-500">Correo</label>
          <input name="email" type="email" required className={`mt-1 ${inputCls}`} />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-neutral-500">Nombre</label>
          <input name="nombre" required className={`mt-1 ${inputCls}`} />
        </div>
        <div>
          <label className="block text-xs text-neutral-500">Contraseña</label>
          <input name="password" type="text" required className={`mt-1 ${inputCls}`} />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-neutral-700">
          <input name="esAdmin" type="checkbox" /> Admin
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {pending ? "Creando…" : "Crear"}
        </button>
      </div>
      <p className="text-xs text-neutral-400">
        Tras crear, edita el usuario para asignar módulos, roles y tiendas.
      </p>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
