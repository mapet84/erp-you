"use client";

import Link from "next/link";
import { useActionState } from "react";
import { guardarUsuario, type UsuarioState } from "../actions";
import { MODULOS } from "@/lib/erp/rbac";

const initial: UsuarioState = {};
const ROLES = ["", "LECTOR", "OPERATIVO", "CONFIGURADOR"] as const;
const inputCls =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400";

interface Props {
  user: {
    id: string;
    nombre: string;
    email: string;
    esAdmin: boolean;
    activo: boolean;
    roles: Record<string, string>;
    tiendaIds: string[];
  };
  tiendas: { id: string; codigo: string; nombre: string }[];
}

export function EditarUsuarioForm({ user, tiendas }: Props) {
  const [state, action, pending] = useActionState(guardarUsuario, initial);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={user.id} />

      <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-neutral-500">Nombre</label>
            <input name="nombre" defaultValue={user.nombre} required className={`mt-1 ${inputCls}`} />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-neutral-500">Correo</label>
            <input value={user.email} disabled className={`mt-1 ${inputCls} bg-neutral-50 text-neutral-400`} />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label className="block text-xs text-neutral-500">Nueva contraseña (opcional)</label>
            <input name="password" type="text" placeholder="Dejar vacío para no cambiar" className={`mt-1 w-72 ${inputCls}`} />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-neutral-700">
            <input name="activo" type="checkbox" defaultChecked={user.activo} /> Activo
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-neutral-700">
            <input name="esAdmin" type="checkbox" defaultChecked={user.esAdmin} /> Administrador (acceso total)
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-neutral-800">Rol por módulo</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MODULOS.map((modulo) => (
            <label key={modulo} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-neutral-700">{modulo}</span>
              <select
                name={`rol_${modulo}`}
                defaultValue={user.roles[modulo] ?? ""}
                className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r === "" ? "— sin acceso —" : r}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-neutral-400">
          Si el usuario es administrador, estos roles se ignoran (tiene acceso total).
        </p>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-neutral-800">Tiendas</h2>
        {tiendas.length === 0 ? (
          <p className="text-sm text-neutral-400">No hay tiendas activas. Crea una en Tiendas.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {tiendas.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  name="tiendas"
                  value={t.id}
                  defaultChecked={user.tiendaIds.includes(t.id)}
                />
                <span className="font-mono text-xs text-neutral-500">{t.codigo}</span> {t.nombre}
              </label>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-neutral-400">
          Sin tiendas marcadas: un CONFIGURADOR ve todas; un OPERATIVO/LECTOR no podrá operar por tienda.
        </p>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
        <Link href="/admin/usuarios" className="text-sm text-neutral-500 hover:text-neutral-800">
          Volver
        </Link>
        {state.ok && <span className="text-sm text-green-600">Guardado ✓</span>}
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
