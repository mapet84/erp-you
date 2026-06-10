// Layout del ERP (grupo de rutas `(erp)`): exige sesión y dibuja el marco común
// (barra superior + cerrar sesión). El portal público de Fase 1 (/f/[slug]) no
// pasa por aquí. La autorización fina por módulo llega en la rebanada #2.

import { requireUser } from "@/lib/erp/session.server";
import { logoutAction } from "./actions";

export default async function ErpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-neutral-50">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
        <span className="font-semibold text-neutral-900">ERP YOU</span>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-neutral-500">{user.email}</span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
