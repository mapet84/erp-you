import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/erp/session.server";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Ya autenticado → directo al dashboard.
  if (await getSessionUser()) redirect("/dashboard");

  const { next } = await searchParams;
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-neutral-900">ERP YOU</h1>
        <p className="mt-1 mb-6 text-sm text-neutral-500">
          Inicia sesión para continuar.
        </p>
        <LoginForm next={safeNext} />
      </div>
    </main>
  );
}
