"use client";

import { useRef } from "react";
import { setTienda } from "./actions";

interface Props {
  tiendas: { id: string; codigo: string; nombre: string }[];
  activa: string;
}

// Si hay una sola tienda accesible, se muestra fija; con varias, un selector
// que cambia la tienda activa al elegir (envía el form de inmediato).
export function StoreSwitcher({ tiendas, activa }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  if (tiendas.length === 0) return null;
  if (tiendas.length === 1) {
    return (
      <span className="text-sm text-neutral-500">
        Tienda: <span className="font-medium text-neutral-700">{tiendas[0].codigo}</span>
      </span>
    );
  }

  return (
    <form ref={formRef} action={setTienda}>
      <select
        name="tiendaId"
        defaultValue={activa}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        aria-label="Tienda activa"
      >
        {tiendas.map((t) => (
          <option key={t.id} value={t.id}>
            {t.codigo} — {t.nombre}
          </option>
        ))}
      </select>
    </form>
  );
}
