import Link from "next/link";
import { requireUser } from "@/lib/erp/session.server";
import { modulosVisibles, type Modulo } from "@/lib/erp/rbac";

const INFO: Record<Modulo, { href: string; label: string; desc: string }> = {
  GESTION: { href: "/gestion", label: "Gestión", desc: "Ingredientes, recetas, costeo y precios" },
  POS: { href: "/pos", label: "Punto de Venta", desc: "Ventas, ticket e inventario" },
  FINANZAS: { href: "/finanzas", label: "Finanzas", desc: "Compras, gastos y estado de resultados" },
  PRONOSTICOS: { href: "/pronosticos", label: "Pronósticos", desc: "Pronóstico de ventas y compras" },
};

export default async function DashboardPage() {
  const user = await requireUser();
  const modulos = modulosVisibles(user);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold text-neutral-900">
        Hola, {user.nombre || user.email}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        {modulos.length > 0
          ? "Estos son los módulos a los que tienes acceso."
          : "Aún no tienes acceso a ningún módulo. Pide a un administrador que te asigne roles."}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {modulos.map((m) => (
          <Link
            key={m}
            href={INFO[m].href}
            className="rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-400"
          >
            <h2 className="font-medium text-neutral-900">{INFO[m].label}</h2>
            <p className="mt-1 text-sm text-neutral-500">{INFO[m].desc}</p>
          </Link>
        ))}
      </div>

      {user.esAdmin && (
        <div className="mt-6 flex gap-3 text-sm">
          <Link href="/admin/usuarios" className="rounded-md border border-neutral-300 px-3 py-1.5 text-neutral-700 hover:bg-neutral-100">
            Administrar usuarios
          </Link>
          <Link href="/admin/tiendas" className="rounded-md border border-neutral-300 px-3 py-1.5 text-neutral-700 hover:bg-neutral-100">
            Administrar tiendas
          </Link>
        </div>
      )}
    </div>
  );
}
