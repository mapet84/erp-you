// Descarga de los archivos fiscales conservados (#4): XML / PDF.
// GET /factura/{invoiceId}/{xml|pdf} → sirve los bytes guardados en BD.

import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ invoiceId: string; tipo: string }> },
) {
  const { invoiceId, tipo } = await params;

  if (tipo !== "xml" && tipo !== "pdf") {
    return new Response("Tipo de archivo no soportado.", { status: 400 });
  }

  const file = await prisma.invoiceFile.findUnique({
    where: { invoiceId_tipo: { invoiceId, tipo } },
    include: { invoice: { select: { uuid: true, folioTicket: true } } },
  });
  if (!file) {
    return new Response("Archivo no encontrado.", { status: 404 });
  }

  const nombre = `${file.invoice.uuid ?? file.invoice.folioTicket}.${tipo}`;
  const bytes = new Uint8Array(file.contenido);

  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
