import Link from "next/link";
import { requireCan } from "@/lib/erp/session.server";

const SECCIONES = [
  { href: "/finanzas/compras", label: "Compras", desc: "Entradas de inventario y recosteo (CPM)" },
  { href: "/finanzas/inventario", label: "Inventario", desc: "Existencias y costo por tienda" },
];

export default async function FinanzasPage() {
  await requireCan("FINANZAS", "read");
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-neutral-900">Finanzas</h1>
      <p className="mt-1 text-sm text-neutral-500">Compras, inventario y resultados.</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECCIONES.map((s) => (
          <Link key={s.href} href={s.href} className="rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-400">
            <h2 className="font-medium text-neutral-900">{s.label}</h2>
            <p className="mt-1 text-sm text-neutral-500">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
