// Configuración de correo (#5). El envío es COMPLEMENTARIO: si no hay API key /
// remitente configurados, el portal sigue funcionando (timbrado + descarga) y
// simplemente no se envía correo. Por eso esto devuelve null en vez de lanzar.

import { z } from "zod";
import { ResendClient } from "./resend-client";

// Strings opcionales; "" (variable presente pero vacía) cuenta como ausente.
const envSchema = z.object({
  RESEND_API_KEY: z.string().optional(),
  /** Remitente verificado en Resend, p.ej. "Panadería Demo <facturas@tudominio.mx>". */
  EMAIL_FROM: z.string().optional(),
});

export interface EmailSender {
  client: ResendClient;
  from: string;
}

/**
 * Construye el remitente de correo desde el entorno, o `null` si no está
 * configurado (sin API key o sin remitente). El llamador trata null como
 * "correo deshabilitado", no como error.
 */
export function emailSenderFromEnv(
  source: NodeJS.ProcessEnv = process.env,
): EmailSender | null {
  const env = envSchema.parse(source);
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.EMAIL_FROM?.trim();
  if (!apiKey || !from) return null;
  return { client: new ResendClient({ apiKey }), from };
}
