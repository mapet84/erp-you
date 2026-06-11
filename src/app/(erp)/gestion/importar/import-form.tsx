"use client";

import { useActionState } from "react";
import type { ImportState } from "./actions";

const initial: ImportState = {};

interface Props {
  titulo: string;
  formato: string;
  ejemplo: string;
  action: (prev: ImportState, fd: FormData) => Promise<ImportState>;
}

export function ImportForm({ titulo, formato, ejemplo, action }: Props) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <div>
        <h2 className="text-sm font-medium text-neutral-900">{titulo}</h2>
        <p className="mt-1 text-xs text-neutral-500">Columnas: <span className="font-mono">{formato}</span></p>
      </div>

      <input type="file" name="archivo" accept=".csv,text/csv" className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-md file:border file:border-neutral-300 file:bg-neutral-50 file:px-3 file:py-1.5 file:text-sm" />

      <details className="text-xs text-neutral-500">
        <summary className="cursor-pointer">…o pega el CSV</summary>
        <textarea name="texto" rows={4} placeholder={ejemplo} className="mt-2 w-full rounded-md border border-neutral-300 p-2 font-mono text-xs" />
      </details>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">
          {pending ? "Importando…" : "Importar"}
        </button>
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
        {state.ok && state.resumen && (
          <span className="text-sm text-green-700">
            Creados {state.resumen.creados} · saltados {state.resumen.saltados}
            {state.resumen.errores.length > 0 ? ` · ${state.resumen.errores.length} con error` : ""}
          </span>
        )}
      </div>

      {state.resumen && state.resumen.errores.length > 0 && (
        <ul className="max-h-32 overflow-auto rounded-md bg-red-50 p-2 text-xs text-red-700">
          {state.resumen.errores.slice(0, 30).map((e, i) => (<li key={i}>{e}</li>))}
        </ul>
      )}
    </form>
  );
}
