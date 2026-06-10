"use server";

// Server Action del portal de autofacturación (slice #3, camino feliz).
// Valida los datos del receptor, desglosa el IVA, arma el CFDI 4.0, lo timbra
// en Facturama Multiemisor y persiste la factura. Idempotente por (emisor, folio).

import { prisma } from "@/lib/db";
import { construirCfdi, type ConceptoEmisor } from "@/lib/cfdi-builder";
import { receptorSchema } from "@/lib/billing-rules";
import { catalogosValidos } from "@/lib/catalogs";
import { desglosarIva } from "@/lib/tax";
import { facturamaClientFromEnv } from "@/lib/facturama/config";
import { FacturamaError, extractUuid } from "@/lib/facturama/client";

export interface EmitirState {
  ok?: boolean;
  /** Folio fiscal del CFDI timbrado (en éxito). */
  uuid?: string;
  /** Indica que el folio ya estaba facturado (idempotencia). */
  yaExistia?: boolean;
  /** Mensaje de error general (validación o PAC). */
  error?: string;
  /** Errores por campo del formulario. */
  fieldErrors?: Record<string, string>;
  /** Valores capturados, para repoblar el formulario tras un error. */
  values?: Record<string, string>;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function emitirFactura(
  _prev: EmitirState,
  formData: FormData,
): Promise<EmitirState> {
  const slug = str(formData, "slug");
  const values = {
    rfc: str(formData, "rfc"),
    nombre: str(formData, "nombre"),
    cp: str(formData, "cp"),
    regimenFiscal: str(formData, "regimenFiscal"),
    usoCfdi: str(formData, "usoCfdi"),
    formaPago: str(formData, "formaPago"),
    email: str(formData, "email"),
    folioTicket: str(formData, "folioTicket"),
    total: str(formData, "total"),
  };

  // 1. Emisor (tenant). Debe existir y estar activo.
  const emisor = await prisma.emisor.findUnique({ where: { slug } });
  if (!emisor || !emisor.activo) {
    return { ok: false, error: "Emisor no disponible.", values };
  }
  if (!emisor.conceptoDefault || !emisor.regimenFiscal || !emisor.cpExpedicion) {
    return {
      ok: false,
      error: "El emisor no tiene configuración fiscal completa.",
      values,
    };
  }

  // 2. Validación de los datos fiscales del receptor (formato + catálogos).
  const parsed = receptorSchema(catalogosValidos).safeParse({
    rfc: values.rfc,
    nombre: values.nombre,
    cp: values.cp,
    regimenFiscal: values.regimenFiscal,
    usoCfdi: values.usoCfdi,
    formaPago: values.formaPago,
    email: values.email,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Revisa los datos capturados.", fieldErrors, values };
  }
  const receptor = parsed.data;

  // 3. Folio y total.
  const total = Number(values.total);
  if (!Number.isFinite(total) || total <= 0) {
    return {
      ok: false,
      error: "Captura un total válido.",
      fieldErrors: { total: "El total debe ser un monto mayor a 0." },
      values,
    };
  }
  if (!values.folioTicket) {
    return {
      ok: false,
      error: "Captura el folio del ticket.",
      fieldErrors: { folioTicket: "El folio del ticket es obligatorio." },
      values,
    };
  }

  // 4. Idempotencia: si ya se facturó ese folio para el emisor, regresa el UUID.
  const existente = await prisma.invoice.findUnique({
    where: { emisorId_folioTicket: { emisorId: emisor.id, folioTicket: values.folioTicket } },
  });
  if (existente) {
    return {
      ok: true,
      uuid: existente.uuid ?? undefined,
      yaExistia: true,
      values,
    };
  }

  // 5. Desglose de IVA y armado del CFDI 4.0 Multiemisor.
  const concepto = emisor.conceptoDefault as unknown as ConceptoEmisor;
  const { subtotal, iva, total: totalExacto } = desglosarIva(total, concepto.tasaIva);

  const payload = construirCfdi({
    emisor: {
      rfc: emisor.rfc,
      razonSocial: emisor.razonSocial,
      regimenFiscal: emisor.regimenFiscal,
      cpExpedicion: emisor.cpExpedicion,
      concepto,
    },
    receptor: {
      rfc: receptor.rfc,
      nombre: receptor.nombre,
      cp: receptor.cp,
      regimenFiscal: receptor.regimenFiscal,
      usoCfdi: receptor.usoCfdi,
    },
    comprobante: {
      formaPago: receptor.formaPago,
      folio: values.folioTicket,
      total: totalExacto,
    },
  });

  // 6. Timbrado en sandbox + persistencia de la factura.
  try {
    const facturama = facturamaClientFromEnv();
    const cfdi = await facturama.createCfdi(payload);
    const uuid = extractUuid(cfdi);

    await prisma.invoice.create({
      data: {
        emisorId: emisor.id,
        folioTicket: values.folioTicket,
        total: totalExacto,
        subtotal,
        iva,
        receptorRfc: receptor.rfc,
        receptorNombre: receptor.nombre,
        receptorCp: receptor.cp,
        receptorRegimen: receptor.regimenFiscal,
        usoCfdi: receptor.usoCfdi,
        formaPago: receptor.formaPago,
        email: receptor.email,
        estatus: "timbrada",
        uuid,
        facturamaCfdiId: cfdi.Id,
      },
    });

    return { ok: true, uuid, values };
  } catch (e) {
    // La traducción fina de errores del PAC es el slice #8; aquí pasamos el mensaje.
    const error =
      e instanceof FacturamaError
        ? `El PAC rechazó la factura: ${e.message}`
        : "No se pudo timbrar la factura. Intenta de nuevo.";
    return { ok: false, error, values };
  }
}
