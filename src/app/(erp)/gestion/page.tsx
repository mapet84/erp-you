import Link from "next/link";
import { requireCan } from "@/lib/erp/session.server";

const SECCIONES = [
  { href: "/gestion/ingredientes", label: "Ingredientes", desc: "Materia prima y costo de compra" },
  { href: "/gestion/semiterminados", label: "Semi-terminados", desc: "Preparaciones reutilizables" },
  { href: "/gestion/recetas", label: "Recetas", desc: "Recetas, costo y precio sugerido" },
  { href: "/gestion/productos", label: "Productos", desc: "Artículos no-receta y su precio" },
  { href: "/gestion/precios", label: "Precios y márgenes", desc: "Repreciar y reporte por canal" },
  { href: "/gestion/margenes", label: "Márgenes objetivo", desc: "Margen por categoría y canal" },
  { href: "/gestion/comisiones", label: "Comisiones", desc: "Comisión por canal y medio de pago" },
  { href: "/gestion/clientes", label: "Clientes", desc: "Clientes para órdenes de venta" },
  { href: "/gestion/ordenes", label: "Órdenes de venta", desc: "Pedidos y su seguimiento" },
  { href: "/gestion/importar", label: "Importar CSV", desc: "Carga masiva de catálogos" },
];

export default async function GestionPage() {
  await requireCan("GESTION", "read");
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-neutral-900">Gestión</h1>
      <p className="mt-1 text-sm text-neutral-500">Datos maestros, costeo y precios.</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECCIONES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-400"
          >
            <h2 className="font-medium text-neutral-900">{s.label}</h2>
            <p className="mt-1 text-sm text-neutral-500">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
