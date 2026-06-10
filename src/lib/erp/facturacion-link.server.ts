// Vínculo de facturación (rebanada #10). El ERP NO timbra: reutiliza el portal
// de autofacturación de Fase 1. El POS genera el folio del ticket; el cliente se
// autofactura en /f/[slug] usando ese folio, y aquí leemos `public.Invoice`
// (esquema separado, sin FK cross-schema) para reflejar el estado.
//
// Supuesto: una sola empresa = un solo RFC/Emisor, así que el `folioTicket`
// identifica de forma única la autofactura.

import { prisma } from "@/lib/db";

export interface EstadoFacturaTicket {
  facturada: boolean;
  uuid?: string;
}

/// Dado un conjunto de folios de ticket, devuelve el estado de autofactura de
/// cada uno leyendo las facturas timbradas del portal.
export async function estadosFacturaPorFolio(
  folios: string[],
): Promise<Map<string, EstadoFacturaTicket>> {
  const limpios = folios.filter(Boolean);
  if (limpios.length === 0) return new Map();
  const invoices = await prisma.invoice.findMany({
    where: { folioTicket: { in: limpios }, estatus: "timbrada" },
    select: { folioTicket: true, uuid: true },
  });
  return new Map(invoices.map((i) => [i.folioTicket, { facturada: true, uuid: i.uuid ?? undefined }]));
}
