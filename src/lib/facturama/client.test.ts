import { describe, it, expect } from "vitest";
import {
  FacturamaClient,
  FacturamaError,
  FACTURAMA_BASE_URLS,
  type UploadCsdInput,
} from "./client";

// Helper: un fetch falso que registra la última llamada y responde lo indicado.
function fakeFetch(response: {
  ok?: boolean;
  status?: number;
  body?: unknown;
}) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const impl = (async (url: string | URL | Request, init: RequestInit = {}) => {
    calls.push({ url: String(url), init });
    const bodyText =
      typeof response.body === "string"
        ? response.body
        : JSON.stringify(response.body ?? {});
    return {
      ok: response.ok ?? true,
      status: response.status ?? 200,
      text: async () => bodyText,
    } as Response;
  }) as unknown as typeof fetch;
  return { impl, calls };
}

const CSD_INPUT: UploadCsdInput = {
  rfc: "EKU9003173C9",
  certificateBase64: "Q0VSX0JBU0U2NA==",
  privateKeyBase64: "S0VZX0JBU0U2NA==",
  privateKeyPassword: "12345678a",
};

describe("FacturamaClient · auth y ambiente", () => {
  it("usa Basic auth con base64 de user:password", async () => {
    const { impl, calls } = fakeFetch({ body: {} });
    const client = new FacturamaClient({
      user: "usuario",
      password: "secreto",
      fetchImpl: impl,
    });

    await client.listCsds();

    const auth = (calls[0].init.headers as Record<string, string>)[
      "Authorization"
    ];
    const expected =
      "Basic " + Buffer.from("usuario:secreto").toString("base64");
    expect(auth).toBe(expected);
  });

  it("apunta a sandbox por defecto", async () => {
    const { impl, calls } = fakeFetch({ body: [] });
    const client = new FacturamaClient({
      user: "u",
      password: "p",
      fetchImpl: impl,
    });
    await client.listCsds();
    expect(calls[0].url).toBe(FACTURAMA_BASE_URLS.sandbox + "api-lite/csds");
  });

  it("apunta a producción cuando env=production", async () => {
    const { impl, calls } = fakeFetch({ body: [] });
    const client = new FacturamaClient({
      user: "u",
      password: "p",
      env: "production",
      fetchImpl: impl,
    });
    await client.listCsds();
    expect(calls[0].url).toBe(FACTURAMA_BASE_URLS.production + "api-lite/csds");
  });

  it("exige user y password", () => {
    expect(
      () => new FacturamaClient({ user: "", password: "p" }),
    ).toThrow();
  });
});

describe("FacturamaClient · uploadCsd", () => {
  it("hace POST a api-lite/csds con el body del contrato Facturama", async () => {
    const { impl, calls } = fakeFetch({ body: { Rfc: CSD_INPUT.rfc } });
    const client = new FacturamaClient({
      user: "u",
      password: "p",
      fetchImpl: impl,
    });

    await client.uploadCsd(CSD_INPUT);

    const { url, init } = calls[0];
    expect(url).toBe(FACTURAMA_BASE_URLS.sandbox + "api-lite/csds");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
    expect(JSON.parse(init.body as string)).toEqual({
      Rfc: "EKU9003173C9",
      Certificate: "Q0VSX0JBU0U2NA==",
      PrivateKey: "S0VZX0JBU0U2NA==",
      PrivateKeyPassword: "12345678a",
    });
  });

  it("devuelve el cuerpo parseado en éxito", async () => {
    const { impl } = fakeFetch({ body: { Rfc: "EKU9003173C9" } });
    const client = new FacturamaClient({
      user: "u",
      password: "p",
      fetchImpl: impl,
    });
    const csd = await client.uploadCsd(CSD_INPUT);
    expect(csd.Rfc).toBe("EKU9003173C9");
  });
});

describe("FacturamaClient · manejo de error", () => {
  it("lanza FacturamaError con status y mensaje del PAC", async () => {
    const { impl } = fakeFetch({
      ok: false,
      status: 400,
      body: { Message: "El RFC no es válido" },
    });
    const client = new FacturamaClient({
      user: "u",
      password: "p",
      fetchImpl: impl,
    });

    await expect(client.uploadCsd(CSD_INPUT)).rejects.toMatchObject({
      name: "FacturamaError",
      statusCode: 400,
      message: "El RFC no es válido",
    });
    await expect(client.uploadCsd(CSD_INPUT)).rejects.toBeInstanceOf(
      FacturamaError,
    );
  });
});

describe("FacturamaClient · getCsd / removeCsd", () => {
  it("getCsd hace GET a api-lite/csds/{rfc}", async () => {
    const { impl, calls } = fakeFetch({ body: { Rfc: "EKU9003173C9" } });
    const client = new FacturamaClient({
      user: "u",
      password: "p",
      fetchImpl: impl,
    });
    await client.getCsd("EKU9003173C9");
    expect(calls[0].url).toBe(
      FACTURAMA_BASE_URLS.sandbox + "api-lite/csds/EKU9003173C9",
    );
    expect(calls[0].init.method).toBe("GET");
  });

  it("removeCsd hace DELETE a api-lite/csds/{rfc}", async () => {
    const { impl, calls } = fakeFetch({ body: {} });
    const client = new FacturamaClient({
      user: "u",
      password: "p",
      fetchImpl: impl,
    });
    await client.removeCsd("EKU9003173C9");
    expect(calls[0].url).toBe(
      FACTURAMA_BASE_URLS.sandbox + "api-lite/csds/EKU9003173C9",
    );
    expect(calls[0].init.method).toBe("DELETE");
  });
});
