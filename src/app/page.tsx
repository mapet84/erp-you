import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-bold">ERP YOU</h1>
      <p className="max-w-md text-neutral-600">
        Portal de autofacturación CFDI 4.0. Cada emisor tiene su portal público en{" "}
        <code className="rounded bg-neutral-100 px-1">/f/&lt;slug&gt;</code>.
      </p>
      <Link
        href="/f/demo"
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
      >
        Ver portal demo →
      </Link>
    </main>
  );
}
