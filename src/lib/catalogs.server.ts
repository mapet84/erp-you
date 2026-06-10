// Carga de catálogos del SAT desde la BD (#6). Server-only (usa Prisma).
// El formulario y la Server Action consumen estas claves vigentes en lugar de
// listas hardcodeadas; la siembra vive en prisma/seed.ts (fuente: catalogs.ts).

import { prisma } from "@/lib/db";
import type { OpcionCatalogo } from "@/lib/catalogs";
import {
  REGIMENES_FISCALES,
  USOS_CFDI,
  FORMAS_PAGO,
} from "@/lib/catalogs";

export interface CatalogosPortal {
  regimenFiscal: OpcionCatalogo[];
  usoCfdi: OpcionCatalogo[];
  formaPago: OpcionCatalogo[];
}

const FALLBACK: CatalogosPortal = {
  regimenFiscal: REGIMENES_FISCALES,
  usoCfdi: USOS_CFDI,
  formaPago: FORMAS_PAGO,
};

/**
 * Lee los catálogos sembrados en BD, agrupados por tipo y ordenados.
 * Si la BD aún no tiene catálogos (p.ej. seed no corrido), cae al subconjunto
 * curado en código para no romper el portal.
 */
export async function loadCatalogos(): Promise<CatalogosPortal> {
  const rows = await prisma.catalogoSat.findMany({ orderBy: { orden: "asc" } });
  if (rows.length === 0) return FALLBACK;

  const pick = (tipo: string): OpcionCatalogo[] =>
    rows
      .filter((r) => r.tipo === tipo)
      .map((r) => ({ clave: r.clave, descripcion: r.descripcion }));

  const out: CatalogosPortal = {
    regimenFiscal: pick("regimenFiscal"),
    usoCfdi: pick("usoCfdi"),
    formaPago: pick("formaPago"),
  };
  // Defensa: si algún grupo quedó vacío, usa el fallback de ese grupo.
  return {
    regimenFiscal: out.regimenFiscal.length ? out.regimenFiscal : FALLBACK.regimenFiscal,
    usoCfdi: out.usoCfdi.length ? out.usoCfdi : FALLBACK.usoCfdi,
    formaPago: out.formaPago.length ? out.formaPago : FALLBACK.formaPago,
  };
}

/** Conjuntos de claves válidas, para validar con `billing-rules.receptorSchema`. */
export function clavesValidas(cat: CatalogosPortal) {
  return {
    regimenFiscal: cat.regimenFiscal.map((o) => o.clave),
    usoCfdi: cat.usoCfdi.map((o) => o.clave),
    formaPago: cat.formaPago.map((o) => o.clave),
  };
}
