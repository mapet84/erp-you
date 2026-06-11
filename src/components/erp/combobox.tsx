"use client";

import { useMemo, useState } from "react";

export interface ComboOption {
  value: string;
  label: string;
  codigo?: string;
}

const inputCls =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400";

/// Selector con búsqueda: escribes descripción o código y filtra; al elegir,
/// publica el `value` (id) en un input oculto con `name`. Reemplaza a un <select>
/// largo. Soporta Enter (elige el primero) y clic.
export function ComboBox({
  name,
  options,
  placeholder = "Buscar por nombre o código…",
  required = false,
  onSelect,
}: {
  name: string;
  options: ComboOption[];
  placeholder?: string;
  required?: boolean;
  onSelect?: (value: string) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<ComboOption | null>(null);

  const filtradas = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = s
      ? options.filter(
          (o) => o.label.toLowerCase().includes(s) || (o.codigo ?? "").toLowerCase().includes(s),
        )
      : options;
    return base.slice(0, 50);
  }, [q, options]);

  const elegir = (o: ComboOption) => {
    setSel(o);
    setQ("");
    setOpen(false);
    onSelect?.(o.value);
  };

  return (
    <div className="relative">
      <input type="hidden" name={name} value={sel?.value ?? ""} required={required} />
      <input
        type="text"
        autoComplete="off"
        value={sel ? `${sel.codigo ? sel.codigo + " · " : ""}${sel.label}` : q}
        onChange={(e) => {
          setSel(null);
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && open && filtradas.length > 0) {
            e.preventDefault();
            elegir(filtradas[0]);
          }
        }}
        placeholder={placeholder}
        className={inputCls}
      />
      {open && filtradas.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
          {filtradas.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  elegir(o);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-neutral-100"
              >
                {o.codigo && <span className="font-mono text-xs text-neutral-400">{o.codigo}</span>}
                <span className="text-neutral-800">{o.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
