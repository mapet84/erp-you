// Adaptador mínimo de Resend para enviar correo (#5).
// Sigue el patrón del facturama-client: fetch inyectable, sin SDK, testeable.
// Contrato: POST https://api.resend.com/emails  ·  Authorization: Bearer <key>.

const RESEND_URL = "https://api.resend.com/emails";

export interface EmailAttachment {
  filename: string;
  /** Contenido en base64. */
  content: string;
  content_type?: string;
}

export interface SendEmailInput {
  from: string;
  to: string[];
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  id: string;
}

/** Error tipado de Resend (incluye status y cuerpo crudo). */
export class EmailError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "EmailError";
  }
}

export interface ResendConfig {
  apiKey: string;
  /** Inyectable para tests; por defecto usa el `fetch` global. */
  fetchImpl?: typeof fetch;
}

export class ResendClient {
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: ResendConfig) {
    if (!config.apiKey) throw new Error("ResendClient requiere apiKey.");
    this.apiKey = config.apiKey;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const res = await this.fetchImpl(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const raw = await res.text();
    let parsed: unknown = undefined;
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = raw;
      }
    }

    if (!res.ok) {
      const msg =
        parsed && typeof parsed === "object" && "message" in parsed
          ? String((parsed as Record<string, unknown>).message)
          : `Resend respondió ${res.status}`;
      throw new EmailError(msg, res.status, parsed);
    }

    return parsed as SendEmailResult;
  }
}
