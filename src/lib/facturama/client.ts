// Adaptador de la API Multiemisor de Facturama.
//
// Contrato (verificado contra los SDKs oficiales de Facturama):
//   - Carga de CSD:   POST   api-lite/csds   body { Rfc, Certificate, PrivateKey, PrivateKeyPassword }
//   - Consulta CSD:   GET    api-lite/csds  ·  GET api-lite/csds/{rfc}
//   - Baja CSD:       DELETE api-lite/csds/{rfc}
//   - Timbrado CFDI:  POST   api-lite/3/cfdis            (se usa en el slice #3)
// Auth: HTTP Basic. En Multiemisor el "emisor" se da de alta implícitamente al
// cargar su CSD por RFC (no hay endpoint createIssuer separado).

export type FacturamaEnv = "sandbox" | "production";

export const FACTURAMA_BASE_URLS: Record<FacturamaEnv, string> = {
  sandbox: "https://apisandbox.facturama.mx/",
  production: "https://api.facturama.mx/",
};

export interface FacturamaConfig {
  user: string;
  password: string;
  /** Ambiente. Default: "sandbox" (las cuentas son independientes por ambiente). */
  env?: FacturamaEnv;
  /** Inyectable para tests; por defecto usa el `fetch` global. */
  fetchImpl?: typeof fetch;
}

/** Datos para cargar un CSD. Certificate/PrivateKey son base64 del .cer/.key. */
export interface UploadCsdInput {
  rfc: string;
  certificateBase64: string;
  privateKeyBase64: string;
  privateKeyPassword: string;
}

export interface Csd {
  Rfc: string;
  CerExpirationDate?: string;
  [key: string]: unknown;
}

/** Bloque del timbre fiscal (TFD) en la respuesta del CFDI. */
export interface TaxStamp {
  Uuid?: string;
  Date?: string;
  [key: string]: unknown;
}

/** CFDI timbrado devuelto por Facturama (POST api-lite/3/cfdis). */
export interface StampedCfdi {
  Id: string;
  Status?: string;
  Date?: string;
  Folio?: string;
  /** El timbre puede venir en la raíz o dentro de Complement, según la versión. */
  TaxStamp?: TaxStamp;
  Complement?: { TaxStamp?: TaxStamp; [key: string]: unknown };
  [key: string]: unknown;
}

/** Extrae el folio fiscal (UUID) de un CFDI timbrado, venga donde venga. */
export function extractUuid(cfdi: StampedCfdi): string | undefined {
  return cfdi.TaxStamp?.Uuid ?? cfdi.Complement?.TaxStamp?.Uuid;
}

/** Respuesta de descarga de archivo (XML/PDF) en base64. */
export interface FileDownload {
  ContentEncoding?: string;
  ContentType?: string;
  ContentLength?: number;
  Content: string;
}

/** Error tipado de la API de Facturama (incluye el status y el cuerpo crudo). */
export class FacturamaError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "FacturamaError";
  }
}

function buildAuthHeader(user: string, password: string): string {
  const token = Buffer.from(`${user}:${password}`).toString("base64");
  return `Basic ${token}`;
}

/**
 * Detecta el error idempotente de Facturama: el CSD ya está asociado al RFC.
 * El texto viene en ModelState (no en Message), por eso revisamos todo el body.
 */
function csdAlreadyExists(e: FacturamaError): boolean {
  if (e.statusCode !== 400) return false;
  const haystack = `${e.message} ${JSON.stringify(e.body ?? "")}`;
  return /ya existe un csd/i.test(haystack);
}

function extractErrorMessage(status: number, parsed: unknown, raw: string): string {
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.Message === "string") return obj.Message;
    if (typeof obj.message === "string") return obj.message;
  }
  return raw || `Facturama respondió ${status}`;
}

export class FacturamaClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: FacturamaConfig) {
    if (!config.user || !config.password) {
      throw new Error("FacturamaClient requiere user y password.");
    }
    this.baseUrl = FACTURAMA_BASE_URLS[config.env ?? "sandbox"];
    this.authHeader = buildAuthHeader(config.user, config.password);
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = this.baseUrl + path.replace(/^\//, "");
    const res = await this.fetchImpl(url, {
      method,
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
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
      throw new FacturamaError(
        extractErrorMessage(res.status, parsed, raw),
        res.status,
        parsed,
      );
    }

    return parsed as T;
  }

  /**
   * Carga (da de alta) el CSD de un RFC en Facturama.
   * En éxito la API responde con cuerpo vacío; en ese caso devolvemos
   * `{ Rfc }` para que el llamador siempre tenga un Csd usable.
   */
  async uploadCsd(input: UploadCsdInput): Promise<Csd> {
    const result = await this.request<Csd | undefined>("POST", "api-lite/csds", {
      Rfc: input.rfc,
      Certificate: input.certificateBase64,
      PrivateKey: input.privateKeyBase64,
      PrivateKeyPassword: input.privateKeyPassword,
    });
    return result ?? { Rfc: input.rfc };
  }

  /**
   * Garantiza que el CSD del RFC quede cargado, de forma idempotente.
   * Si Facturama responde que el CSD ya existe (400), lo recupera con getCsd
   * en lugar de fallar — así el alta de emisor se puede re-ejecutar sin error.
   */
  async ensureCsd(input: UploadCsdInput): Promise<Csd> {
    try {
      return await this.uploadCsd(input);
    } catch (e) {
      if (e instanceof FacturamaError && csdAlreadyExists(e)) {
        return this.getCsd(input.rfc);
      }
      throw e;
    }
  }

  /**
   * Timbra un CFDI 4.0 en la API Multiemisor (POST api-lite/3/cfdis).
   * Recibe el payload ya armado por `cfdi-builder`. Devuelve el CFDI timbrado
   * con su Id (para descargar PDF/XML) y el timbre con el UUID.
   */
  createCfdi(payload: unknown): Promise<StampedCfdi> {
    return this.request<StampedCfdi>("POST", "api-lite/3/cfdis", payload);
  }

  /**
   * Descarga el XML del CFDI timbrado (#4). Devuelve los bytes ya decodificados.
   * Endpoint verificado: GET cfdi/xml/issuedLite/{id} → { Content: base64 }.
   */
  async getXml(cfdiId: string): Promise<Buffer> {
    return this.downloadFile("xml", cfdiId);
  }

  /** Descarga el PDF del CFDI timbrado (#4). Devuelve los bytes ya decodificados. */
  async getPdf(cfdiId: string): Promise<Buffer> {
    return this.downloadFile("pdf", cfdiId);
  }

  private async downloadFile(formato: "xml" | "pdf", cfdiId: string): Promise<Buffer> {
    const res = await this.request<FileDownload>(
      "GET",
      `cfdi/${formato}/issuedLite/${encodeURIComponent(cfdiId)}`,
    );
    if (!res?.Content) {
      throw new FacturamaError(`Descarga ${formato} sin contenido`, 200, res);
    }
    return Buffer.from(res.Content, "base64");
  }

  /** Lista los CSD cargados en la cuenta. */
  listCsds(): Promise<Csd[]> {
    return this.request<Csd[]>("GET", "api-lite/csds");
  }

  /** Obtiene el CSD de un RFC (útil para verificar que quedó cargado). */
  getCsd(rfc: string): Promise<Csd> {
    return this.request<Csd>("GET", `api-lite/csds/${encodeURIComponent(rfc)}`);
  }

  /** Elimina el CSD de un RFC. */
  removeCsd(rfc: string): Promise<unknown> {
    return this.request("DELETE", `api-lite/csds/${encodeURIComponent(rfc)}`);
  }
}
