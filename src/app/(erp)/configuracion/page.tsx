import Link from "next/link";
import { requireCan } from "@/lib/erp/session.server";

const SECCIONES = [
  { href: "/configuracion/categorias", label: "Categorías", desc: "Nombre y abreviatura" },
  { href: "/configuracion/tamanos", label: "Tamaños", desc: "Nombre y abreviatura" },
  { href: "/configuracion/unidades", label: "Unidades y conversiones", desc: "Unidades de medida y factores" },
  { href: "/configuracion/canales", label: "Canales", desc: "Medio principal y comisiones por medio" },
  { href: "/configuracion/medios-pago", label: "Medios de pago", desc: "Catálogo de medios de pago" },
  { href: "/configuracion/medios-compra", label: "Medios de compra", desc: "Con días de crédito" },
  { href: "/configuracion/motivos", label: "Motivos de ajuste", desc: "Para ajustes de inventario" },
  { href: "/configuracion/tiendas", label: "Tiendas", desc: "Sucursales" },
];

export default async function ConfiguracionPage() {
  await requireCan("GESTION", "configure");
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-neutral-900">Configuración</h1>
      <p className="mt-1 text-sm text-neutral-500">Catálogos y parámetros del sistema.</p>
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
