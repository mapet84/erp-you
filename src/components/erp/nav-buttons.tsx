"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const btn =
  "rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100";

/// Atrás (pantalla anterior, sin guardar) + Inicio (dashboard). En toda pantalla.
export function NavButtons() {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => router.back()} className={btn} title="Pantalla anterior">
        ← Atrás
      </button>
      <Link href="/dashboard" className={btn} title="Inicio">
        ⌂ Inicio
      </Link>
    </div>
  );
}
