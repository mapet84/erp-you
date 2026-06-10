import Link from "next/link";

// Boundary global de 403 (lo dispara forbidden() desde los guards del ERP).
export default function Forbidden() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <p className="text-3xl font-semibold text-neutral-900">403</p>
      <h1 className="text-lg font-medium text-neutral-800">No tienes acceso</h1>
      <p className="max-w-sm text-sm text-neutral-500">
        Tu usuario no tiene permiso para ver esta sección. Si crees que es un
        error, pide a un administrador que revise tus roles.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
