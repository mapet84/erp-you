// Orquestación del envío de la factura por correo (#5). Best-effort: NUNCA lanza.
// Si el correo no está configurado o el envío falla, devuelve {enviado:false,...}
// para que el llamador lo registre sin romper el timbrado ni la descarga.

import { emailSenderFromEnv, type EmailSender } from "./config";
import { facturaEmailTemplate } from "./template";
import type { EmailAttachment } from "./resend-client";

export interface EnviarFacturaInput {
  to: string;
  emisorNombre: string;
  receptorNombre: string;
  uuid?: string;
  folioTicket: string;
  subtotal: number;
  iva: number;
  total: number;
  xml?: Buffer;
  pdf?: Buffer;
}

export interface EnvioResult {
  enviado: boolean;
  id?: string;
  /** Motivo cuando no se envió (no configurado, fallo de Resend, etc.). */
  error?: string;
}

export async function enviarFacturaPorCorreo(
  input: EnviarFacturaInput,
  sender: EmailSender | null = emailSenderFromEnv(),
): Promise<EnvioResult> {
  if (!sender) {
    return { enviado: false, error: "Correo no configurado (sin RESEND_API_KEY / EMAIL_FROM)." };
  }

  const { subject, html } = facturaEmailTemplate({
    emisorNombre: input.emisorNombre,
    receptorNombre: input.receptorNombre,
    uuid: input.uuid,
    folioTicket: input.folioTicket,
    subtotal: input.subtotal,
    iva: input.iva,
    total: input.total,
  });

  const nombreBase = input.uuid ?? input.folioTicket;
  const attachments: EmailAttachment[] = [];
  if (input.xml) {
    attachments.push({
      filename: `${nombreBase}.xml`,
      content: input.xml.toString("base64"),
      content_type: "application/xml",
    });
  }
  if (input.pdf) {
    attachments.push({
      filename: `${nombreBase}.pdf`,
      content: input.pdf.toString("base64"),
      content_type: "application/pdf",
    });
  }

  try {
    const { id } = await sender.client.sendEmail({
      from: sender.from,
      to: [input.to],
      subject,
      html,
      attachments,
    });
    return { enviado: true, id };
  } catch (e) {
    return { enviado: false, error: e instanceof Error ? e.message : "Error de envío de correo." };
  }
}
