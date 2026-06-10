// Layout del ERP (grupo `(erp)`): exige sesión y dibuja el marco común — nav de
// módulos filtrado por permisos, enlaces de administración (solo admin), selector
// de tienda, y cerrar sesión. El portal público de Fase 1 no pasa por aquí.

import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/erp/session.server";
import { modulosVisibles, type Modulo } from "@/lib/erp/rbac";
import { logoutAction } from "./actions";
import { TIENDA_COOKIE } from "./constants";
import { StoreSwitcher } from "./store-switcher";

const RUTA_MODULO: Record<Modulo, { href: string; label: string }> = {
  GESTION: { href: "/gestion", label: "Gestión" },
  POS: { href: "/pos", label: "POS" },
  FINANZAS: { href: "/finanzas", label: "Finanzas" },
  PRONOSTICOS: { href: "/pronosticos", label: "Pronósticos" },
};

export default async function ErpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  // Tiendas accesibles para el selector: admin → todas las activas; resto → sus
  // tiendas asignadas (activas). Sin restricción y sin admin: ninguna explícita.
  const tiendas = await prisma.tienda.findMany({
    where: {
      activo: true,
      ...(user.esAdmin ? {} : { id: { in: [...user.tiendas] } }),
    },
    orderBy: { codigo: "asc" },
    select: { id: true, codigo: true, nombre: true },
  });
  const jar = await cookies();
  const tiendaActiva = jar.get(TIENDA_COOKIE)?.value ?? tiendas[0]?.id ?? "";

  const modulos = modulosVisibles(user);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold text-neutral-900">
              ERP YOU
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              {modulos.map((m) => (
                <Link
                  key={m}
                  href={RUTA_MODULO[m].href}
                  className="text-neutral-600 hover:text-neutral-900"
                >
                  {RUTA_MODULO[m].label}
                </Link>
              ))}
              {user.esAdmin && (
                <>
                  <Link href="/admin/usuarios" className="text-neutral-600 hover:text-neutral-900">
                    Usuarios
                  </Link>
                  <Link href="/admin/tiendas" className="text-neutral-600 hover:text-neutral-900">
                    Tiendas
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <StoreSwitcher tiendas={tiendas} activa={tiendaActiva} />
            <span className="text-neutral-400">{user.email}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
