// Traducción de rechazos del PAC a mensajes accionables en español (#8).
//
// CFDI 4.0 es estricto: si Nombre/CP/Régimen del receptor no coinciden con su
// Constancia de Situación Fiscal, Facturama rechaza. El detalle útil suele venir
// en `ModelState` (no en `Message`, que es genérico "La solicitud no es válida").
// Este módulo es PURO: recibe el cuerpo del error y devuelve texto, sin red ni BD.

export interface ErrorPacTraducido {
  /** Mensaje accionable para mostrar al cliente. */
  mensaje: string;
  /** Detalle crudo del PAC, para auditoría/persistencia (Invoice.errorPac). */
  detalle: string;
}

/** Extrae el texto más específico del cuerpo de error de Facturama. */
export function extraerDetallePac(body: unknown, fallback = ""): string {
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;
    // ModelState: { "campo": ["mensaje", ...], ... } → junta todos los mensajes.
    const ms = obj.ModelState;
    if (ms && typeof ms === "object") {
      const msgs: string[] = [];
      for (const v of Object.values(ms as Record<string, unknown>)) {
        if (Array.isArray(v)) for (const m of v) if (typeof m === "string") msgs.push(m);
        else if (typeof v === "string") msgs.push(v);
      }
      if (msgs.length) return msgs.join(" ");
    }
    if (typeof obj.Message === "string" && obj.Message) return obj.Message;
    if (typeof obj.message === "string" && obj.message) return obj.message;
  }
  if (typeof body === "string" && body.trim()) return body.trim();
  return fallback;
}

// Patrones conocidos → mensaje accionable. Orden: del más específico al general.
const REGLAS: Array<{ patron: RegExp; mensaje: string }> = [
  {
    patron: /nombre.*asociad|raz[oó]n social.*no coincide|el nombre.*receptor/i,
    mensaje:
      "El nombre o razón social no coincide con el registrado en el SAT. " +
      "Captúralo exactamente como aparece en tu Constancia de Situación Fiscal " +
      "(en mayúsculas y sin el régimen de capital, p. ej. sin “SA DE CV”).",
  },
  {
    patron: /domiciliofiscalreceptor|c[oó]digo postal.*receptor|lista de rfc inscritos/i,
    mensaje:
      "El código postal no coincide con el domicilio fiscal registrado para ese RFC " +
      "en el SAT. Verifica el CP de tu Constancia de Situación Fiscal.",
  },
  {
    patron: /r[eé]gimen.*(fiscal)?.*(no coincide|no corresponde|inv[aá]lid)/i,
    mensaje:
      "El régimen fiscal no corresponde al registrado para ese RFC en el SAT. " +
      "Revisa el régimen en tu Constancia de Situación Fiscal.",
  },
  {
    patron: /rfc.*(no es v[aá]lid|formato|inexistente|no inscrito)/i,
    mensaje: "El RFC no es válido o no está inscrito en el SAT. Verifica que esté bien escrito.",
  },
  {
    patron: /uso.*cfdi|usocfdi/i,
    mensaje: "El uso de CFDI no es válido para ese régimen fiscal. Elige otro uso.",
  },
  {
    patron: /forma.*pago|formapago/i,
    mensaje: "La forma de pago no es válida. Selecciona una forma de pago vigente.",
  },
  {
    patron: /sello|csd|certificad|llave|private ?key/i,
    mensaje:
      "Hubo un problema con el sello digital del emisor. Esto es del lado del negocio; " +
      "intenta más tarde o contáctalo.",
  },
];

/**
 * Traduce un error del PAC a un mensaje accionable + conserva el detalle crudo.
 * `error` puede ser un FacturamaError (tiene `body`) u otro Error.
 */
export function traducirErrorPac(error: {
  message?: string;
  body?: unknown;
}): ErrorPacTraducido {
  const detalle = extraerDetallePac(error.body, error.message ?? "Error del PAC.");
  const base = `${detalle} ${error.message ?? ""}`;

  for (const { patron, mensaje } of REGLAS) {
    if (patron.test(base)) return { mensaje, detalle };
  }

  return {
    mensaje:
      "No se pudo timbrar la factura. Revisa que tus datos fiscales coincidan con tu " +
      "Constancia de Situación Fiscal e inténtalo de nuevo.",
    detalle,
  };
}
