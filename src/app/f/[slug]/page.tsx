import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  isRenderableEmisor,
  nombreParaMostrar,
  type Branding,
  type EmisorPublico,
} from "@/lib/emisor";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FacturaForm } from "./factura-form";
import { loadCatalogos } from "@/lib/catalogs.server";

export default async function PortalEmisorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const row = await prisma.emisor.findUnique({ where: { slug } });

  const emisor: EmisorPublico | null = row
    ? {
        slug: row.slug,
        razonSocial: row.razonSocial,
        activo: row.activo,
        branding: (row.branding ?? {}) as Branding,
      }
    : null;

  // Slug inexistente o emisor inactivo → 404.
  if (!isRenderableEmisor(emisor)) {
    notFound();
  }

  const nombre = nombreParaMostrar(emisor);
  const color = emisor.branding.colorPrimario ?? "#0f172a";

  const catalogos = await loadCatalogos();
  const concepto = (row!.conceptoDefault ?? {}) as { tasaIva?: number };
  const tasaIva = concepto.tasaIva ?? 0.16;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div
            className="mb-2 h-2 w-16 rounded-full"
            style={{ backgroundColor: color }}
          />
          <CardTitle style={{ color }}>{nombre}</CardTitle>
          <CardDescription>Autofacturación CFDI 4.0</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-neutral-600">
            Captura los datos de tu ticket y tus datos fiscales para obtener tu
            factura de <span className="font-medium">{emisor.razonSocial}</span>.
          </p>
          <FacturaForm
            slug={emisor.slug}
            color={color}
            tasaIva={tasaIva}
            catalogos={catalogos}
          />
        </CardContent>
      </Card>
    </main>
  );
}
