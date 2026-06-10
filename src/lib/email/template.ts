// Plantilla del correo de entrega de factura (#5). Puro: solo construye texto.

export interface FacturaEmailInput {
  /** Nombre comercial / razón social del emisor (remitente lógico). */
  emisorNombre: string;
  receptorNombre: string;
  uuid?: string;
  folioTicket: string;
  subtotal: number;
  iva: number;
  total: number;
}

export interface FacturaEmail {
  subject: string;
  html: string;
}

const pesos = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/** Arma asunto + HTML en español para la factura timbrada, con resumen y UUID. */
export function facturaEmailTemplate(input: FacturaEmailInput): FacturaEmail {
  const { emisorNombre, receptorNombre, uuid, folioTicket } = input;

  const subject = `Tu factura de ${emisorNombre}${uuid ? ` · ${uuid}` : ""}`;

  const fila = (k: string, v: string, fuerte = false) =>
    `<tr><td style="padding:4px 0;color:#6b7280">${esc(k)}</td>` +
    `<td style="padding:4px 0;text-align:right;${fuerte ? "font-weight:600;color:#111827" : "color:#111827"}">${esc(v)}</td></tr>`;

  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#fff;border-radius:10px;padding:24px">
      <h1 style="font-size:18px;color:#111827;margin:0 0 8px">Tu factura está lista</h1>
      <p style="font-size:14px;color:#374151;margin:0 0 16px">
        Hola ${esc(receptorNombre)}, adjuntamos tu factura (CFDI 4.0) emitida por
        <strong>${esc(emisorNombre)}</strong> en formato PDF y XML.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${fila("Folio del ticket", folioTicket)}
        ${fila("Subtotal", pesos(input.subtotal))}
        ${fila("IVA", pesos(input.iva))}
        ${fila("Total", pesos(input.total), true)}
      </table>
      ${
        uuid
          ? `<p style="font-size:12px;color:#6b7280;margin:16px 0 0">Folio fiscal (UUID):<br>
             <span style="font-family:monospace;color:#111827">${esc(uuid)}</span></p>`
          : ""
      }
      <p style="font-size:12px;color:#9ca3af;margin:20px 0 0">
        Conserva el XML: es el documento fiscal con validez ante el SAT. El PDF es su representación impresa.
      </p>
    </div>
    <p style="font-size:11px;color:#9ca3af;text-align:center;margin:16px 0 0">
      Enviado por el portal de autofacturación de ${esc(emisorNombre)}.
    </p>
  </div></body></html>`;

  return { subject, html };
}
