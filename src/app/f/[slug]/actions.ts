"use server";

// Server Action del portal de autofacturación.
// #3 timbrado feliz · #6 catálogos de BD · #7 ventana + folio único + retry ·
// #8 traducción de errores del PAC · #4 conservación de XML/PDF.

import { prisma } from "@/lib/db";
import { construirCfdi, type ConceptoEmisor } from "@/lib/cfdi-builder";
import { receptorSchema, dentroDeVentana, type VentanaPolitica } from "@/lib/billing-rules";
import { loadCatalogos, clavesValidas } from "@/lib/catalogs.server";
import { desglosarIva } from "@/lib/tax";
import { traducirErrorPac } from "@/lib/pac-errors";
import { enviarFacturaPorCorreo } from "@/lib/email/send-invoice";
import { facturamaClientFromEnv } from "@/lib/facturama/config";
import {
  FacturamaError,
  extractUuid,
  type FacturamaClient,
} from "@/lib/facturama/client";

export interface FacturaResumen {
  invoiceId: string;
  uuid?: string;
  receptorRfc: string;
  receptorNombre: string;
  subtotal: number;
  iva: number;
  total: number;
  /** Correo del receptor (a dónde se envió / enviará la factura). */
  email: string;
  /** ¿Se entregó por correo en este timbrado? (#5). */
  correoEnviado: boolean;
}

export interface EmitirState {
  ok?: boolean;
  /** Datos de la factura timbrada (para la pantalla de éxito). */
  factura?: FacturaResumen;
  /** El folio ya estaba facturado (idempotencia / candado anti-abuso). */
  yaExistia?: boolean;
  /** Mensaje de error general (validación, ventana o rechazo del PAC). */
  error?: string;
  /** Errores por campo del formulario. */
  fieldErrors?: Record<string, string>;
  /** Valores capturados, para repoblar el formulario tras un error. */
  values?: Record<string, string>;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

/**
 * Descarga y conserva XML/PDF del CFDI (best-effort: no tumba el timbrado).
 * Devuelve los bytes obtenidos para reusarlos como adjuntos del correo (#5).
 */
async function guardarArchivos(
  facturama: FacturamaClient,
  invoiceId: string,
  cfdiId: string,
): Promise<{ xml?: Buffer; pdf?: Buffer }> {
  const archivos = [
    { tipo: "xml" as const, contentType: "application/xml", fetch: () => facturama.getXml(cfdiId) },
    { tipo: "pdf" as const, contentType: "application/pdf", fetch: () => facturama.getPdf(cfdiId) },
  ];

  const bytes: { xml?: Buffer; pdf?: Buffer } = {};
  for (const a of archivos) {
    try {
      const buf = await a.fetch();
      bytes[a.tipo] = buf;
      await prisma.invoiceFile.upsert({
        where: { invoiceId_tipo: { invoiceId, tipo: a.tipo } },
        update: { contenido: new Uint8Array(buf), contentType: a.contentType },
        create: { invoiceId, tipo: a.tipo, contenido: new Uint8Array(buf), contentType: a.contentType },
      });
    } catch {
      // Si Facturama falla la descarga, el Invoice queda timbrado (no se pierde
      // el UUID); el archivo faltante se puede reintentar después (#4).
    }
  }
  return bytes;
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
    fechaTicket: str(formData, "fechaTicket"),
    total: str(formData, "total"),
  };

  // 1. Emisor (tenant). Debe existir, estar activo y tener config fiscal.
  const emisor = await prisma.emisor.findUnique({ where: { slug } });
  if (!emisor || !emisor.activo) {
    return { ok: false, error: "Emisor no disponible.", values };
  }
  if (!emisor.conceptoDefault || !emisor.regimenFiscal || !emisor.cpExpedicion) {
    return { ok: false, error: "El emisor no tiene configuración fiscal completa.", values };
  }

  // 2. Validación de los datos fiscales del receptor (formato + catálogos de BD).
  const catalogos = await loadCatalogos();
  const parsed = receptorSchema(clavesValidas(catalogos)).safeParse({
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

  // 3. Folio, total y fecha del ticket (#7).
  const fieldErrors: Record<string, string> = {};
  const total = Number(values.total);
  if (!Number.isFinite(total) || total <= 0) {
    fieldErrors.total = "El total debe ser un monto mayor a 0.";
  }
  if (!values.folioTicket) {
    fieldErrors.folioTicket = "El folio del ticket es obligatorio.";
  }
  const fechaTicket = values.fechaTicket ? new Date(values.fechaTicket + "T12:00:00") : null;
  if (!fechaTicket || Number.isNaN(fechaTicket.getTime())) {
    fieldErrors.fechaTicket = "Captura la fecha del ticket.";
  } else {
    const ventana = dentroDeVentana(
      fechaTicket,
      new Date(),
      (emisor.ventanaFacturacion as VentanaPolitica) ?? "MISMO_MES",
    );
    if (!ventana.ok) fieldErrors.fechaTicket = ventana.motivo!;
  }
  if (Object.keys(fieldErrors).length) {
    return { ok: false, error: "Revisa los datos capturados.", fieldErrors, values };
  }

  // 4. Candado de folio único (#7): un folio ya TIMBRADO se bloquea; un row en
  //    estatus "error" (rechazo previo del PAC) sí se puede reintentar (#8).
  const existente = await prisma.invoice.findUnique({
    where: { emisorId_folioTicket: { emisorId: emisor.id, folioTicket: values.folioTicket } },
  });
  if (existente && existente.estatus === "timbrada") {
    return {
      ok: true,
      yaExistia: true,
      factura: {
        invoiceId: existente.id,
        uuid: existente.uuid ?? undefined,
        receptorRfc: existente.receptorRfc,
        receptorNombre: existente.receptorNombre,
        subtotal: Number(existente.subtotal),
        iva: Number(existente.iva),
        total: Number(existente.total),
        email: existente.email,
        correoEnviado: existente.correoEnviado,
      },
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
    comprobante: { formaPago: receptor.formaPago, folio: values.folioTicket, total: totalExacto },
  });

  // 6. Timbrado + persistencia. Datos comunes del receptor para crear/actualizar.
  const datosReceptor = {
    fechaTicket,
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
  };

  // Sólo el timbrado (createCfdi) decide éxito/rechazo: un fallo en los pasos
  // best-effort posteriores (archivos, correo) NO debe convertir un CFDI ya
  // timbrado en un "error".
  const facturama = facturamaClientFromEnv();
  let cfdi;
  try {
    cfdi = await facturama.createCfdi(payload);
  } catch (e) {
    // #8: traduce el rechazo del PAC y deja el Invoice en estatus "error"
    //     (folio NO consumido para timbrado → un reintento exitoso sí timbra).
    if (e instanceof FacturamaError) {
      const { mensaje, detalle } = traducirErrorPac(e);
      await prisma.invoice.upsert({
        where: { emisorId_folioTicket: { emisorId: emisor.id, folioTicket: values.folioTicket } },
        update: { ...datosReceptor, estatus: "error", errorPac: detalle, uuid: null },
        create: {
          emisorId: emisor.id,
          folioTicket: values.folioTicket,
          ...datosReceptor,
          estatus: "error",
          errorPac: detalle,
        },
      });
      return { ok: false, error: mensaje, values };
    }
    return { ok: false, error: "No se pudo timbrar la factura. Intenta de nuevo.", values };
  }

  // Timbrado exitoso: persiste el Invoice como "timbrada".
  const uuid = extractUuid(cfdi);
  const invoice = await prisma.invoice.upsert({
    where: { emisorId_folioTicket: { emisorId: emisor.id, folioTicket: values.folioTicket } },
    update: { ...datosReceptor, estatus: "timbrada", uuid, facturamaCfdiId: cfdi.Id, errorPac: null },
    create: {
      emisorId: emisor.id,
      folioTicket: values.folioTicket,
      ...datosReceptor,
      estatus: "timbrada",
      uuid,
      facturamaCfdiId: cfdi.Id,
    },
  });

  // #4: conservación de archivos (best-effort, no bloquea el éxito).
  const archivos = await guardarArchivos(facturama, invoice.id, cfdi.Id);

  // #5: entrega por correo (best-effort). Complementaria a la descarga: un
  //     fallo no invalida el timbrado; se registra para reintento.
  const envio = await enviarFacturaPorCorreo({
    to: receptor.email,
    emisorNombre: emisor.razonSocial,
    receptorNombre: receptor.nombre,
    uuid,
    folioTicket: values.folioTicket,
    subtotal,
    iva,
    total: totalExacto,
    xml: archivos.xml,
    pdf: archivos.pdf,
  });
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { correoEnviado: envio.enviado, correoError: envio.enviado ? null : envio.error ?? null },
  });

  return {
    ok: true,
    factura: {
      invoiceId: invoice.id,
      uuid,
      receptorRfc: receptor.rfc,
      receptorNombre: receptor.nombre,
      subtotal,
      iva,
      total: totalExacto,
      email: receptor.email,
      correoEnviado: envio.enviado,
    },
    values,
  };
}
