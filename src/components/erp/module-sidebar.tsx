"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONES: Record<string, { titulo: string; items: { href: string; label: string }[] }> = {
  gestion: {
    titulo: "Gestión",
    items: [
      { href: "/gestion/ingredientes", label: "Ingredientes" },
      { href: "/gestion/semiterminados", label: "Semi-terminados" },
      { href: "/gestion/recetas", label: "Recetas" },
      { href: "/gestion/productos", label: "Productos" },
      { href: "/gestion/precios", label: "Precios y márgenes" },
      { href: "/gestion/margenes", label: "Márgenes objetivo" },
      { href: "/gestion/comisiones", label: "Comisiones" },
      { href: "/gestion/clientes", label: "Clientes" },
      { href: "/gestion/ordenes", label: "Órdenes de venta" },
      { href: "/gestion/importar", label: "Importar CSV" },
    ],
  },
  pos: {
    titulo: "Punto de Venta",
    items: [
      { href: "/pos", label: "Vender" },
      { href: "/pos/historial", label: "Historial" },
    ],
  },
  finanzas: {
    titulo: "Finanzas",
    items: [
      { href: "/finanzas/compras", label: "Compras" },
      { href: "/finanzas/inventario", label: "Inventario" },
      { href: "/finanzas/gastos", label: "Gastos" },
      { href: "/finanzas/estado-resultados", label: "Estado de resultados" },
    ],
  },
  pronosticos: {
    titulo: "Pronósticos",
    items: [{ href: "/pronosticos", label: "Pronósticos" }],
  },
  admin: {
    titulo: "Administración",
    items: [
      { href: "/admin/usuarios", label: "Usuarios" },
      { href: "/admin/tiendas", label: "Tiendas" },
    ],
  },
};

/// Barra lateral con las secciones del módulo actual (según la URL). No aparece
/// fuera de un módulo (p. ej. en el dashboard).
export function ModuleSidebar() {
  const path = usePathname();
  const seg = path.split("/")[1] ?? "";
  const mod = SECCIONES[seg];
  if (!mod) return null;

  // Sección activa = el href más largo que sea prefijo de la ruta actual.
  const activeHref = mod.items
    .filter((it) => path === it.href || path.startsWith(it.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <aside className="hidden w-52 shrink-0 border-r border-neutral-200 bg-white sm:block">
      <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {mod.titulo}
      </div>
      <nav className="flex flex-col gap-0.5 px-2 pb-4">
        {mod.items.map((it) => {
          const active = it.href === activeHref;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={
                active
                  ? "rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
                  : "rounded-md px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
              }
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
