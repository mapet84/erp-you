import { requireUser } from "@/lib/erp/session.server";

// Los 4 módulos del ERP. En la rebanada #1 son tarjetas informativas; se
// activan en sus respectivas rebanadas (#3+ Gestión, #7 POS, #9 Finanzas,
// #11 Pronósticos) y se filtrarán por los permisos del usuario (#2).
const MODULOS = [
  { nombre: "Gestión", desc: "Ingredientes, recetas, costeo y precios" },
  { nombre: "Punto de Venta", desc: "Ventas, ticket e inventario" },
  { nombre: "Finanzas", desc: "Compras, gastos y estado de resultados" },
  { nombre: "Pronósticos", desc: "Pronóstico de ventas y compras" },
] as const;

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold text-neutral-900">
        Hola, {user.nombre || user.email}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Bienvenido al ERP. Los módulos se irán habilitando por rebanada.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MODULOS.map((m) => (
          <div
            key={m.nombre}
            className="rounded-xl border border-neutral-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-neutral-900">{m.nombre}</h2>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                Próximamente
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-500">{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
