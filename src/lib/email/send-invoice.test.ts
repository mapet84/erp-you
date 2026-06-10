import { describe, it, expect } from "vitest";
import { facturaEmailTemplate } from "./template";
import { enviarFacturaPorCorreo } from "./send-invoice";
import { ResendClient } from "./resend-client";

const baseFactura = {
  emisorNombre: "Panadería Demo",
  receptorNombre: "PÚBLICO EN GENERAL",
  uuid: "abc-123",
  folioTicket: "T-1",
  subtotal: 100,
  iva: 16,
  total: 116,
};

describe("facturaEmailTemplate", () => {
  it("incluye emisor, receptor, montos y UUID, y escapa HTML", () => {
    const { subject, html } = facturaEmailTemplate({ ...baseFactura, receptorNombre: 'A <b> & "c"' });
    expect(subject).toContain("Panadería Demo");
    expect(subject).toContain("abc-123");
    expect(html).toContain("abc-123");
    expect(html).toContain("$116.00");
    expect(html).toContain("&lt;b&gt;"); // escapado
    expect(html).not.toContain("<b>");
  });

  it("omite el bloque de UUID si no hay timbre", () => {
    const { subject, html } = facturaEmailTemplate({ ...baseFactura, uuid: undefined });
    expect(subject).not.toContain("·");
    expect(html).not.toContain("Folio fiscal");
  });
});

interface SentBody {
  to: string[];
  attachments: Array<{ filename: string; content: string; content_type?: string }>;
}

function fakeSender(capture: { input?: SentBody }, opts: { fail?: boolean } = {}) {
  const impl = (async () => {
    return {
      ok: !opts.fail,
      status: opts.fail ? 422 : 200,
      text: async () => JSON.stringify(opts.fail ? { message: "boom" } : { id: "email-9" }),
    } as Response;
  }) as unknown as typeof fetch;
  return {
    client: new ResendClient({
      apiKey: "re_x",
      fetchImpl: (async (url: string, init: RequestInit) => {
        capture.input = JSON.parse(init.body as string);
        return impl(url as unknown as Request, init);
      }) as unknown as typeof fetch,
    }),
    from: "Demo <f@demo.mx>",
  };
}

describe("enviarFacturaPorCorreo", () => {
  it("devuelve enviado:false (sin lanzar) si el correo no está configurado", async () => {
    const r = await enviarFacturaPorCorreo({ to: "x@y.mx", ...baseFactura }, null);
    expect(r.enviado).toBe(false);
    expect(r.error).toMatch(/no configurado/i);
  });

  it("envía con adjuntos XML y PDF en base64", async () => {
    const cap: { input?: SentBody } = {};
    const r = await enviarFacturaPorCorreo(
      { to: "cliente@correo.com", ...baseFactura, xml: Buffer.from("<xml/>"), pdf: Buffer.from("%PDF") },
      fakeSender(cap),
    );
    expect(r.enviado).toBe(true);
    expect(r.id).toBe("email-9");
    expect(cap.input!.to).toEqual(["cliente@correo.com"]);
    const tipos = cap.input!.attachments.map((a) => a.content_type).sort();
    expect(tipos).toEqual(["application/pdf", "application/xml"]);
    expect(cap.input!.attachments[0].content).toBe(Buffer.from("<xml/>").toString("base64"));
  });

  it("ante fallo de Resend devuelve enviado:false con el motivo (no lanza)", async () => {
    const cap: { input?: SentBody } = {};
    const r = await enviarFacturaPorCorreo({ to: "x@y.mx", ...baseFactura }, fakeSender(cap, { fail: true }));
    expect(r.enviado).toBe(false);
    expect(r.error).toMatch(/boom/);
  });
});
