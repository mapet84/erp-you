import { describe, it, expect } from "vitest";
import { ResendClient, EmailError } from "./resend-client";

function fakeFetch(response: { ok?: boolean; status?: number; body?: unknown }) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const impl = (async (url: string | URL | Request, init: RequestInit = {}) => {
    calls.push({ url: String(url), init });
    const text = typeof response.body === "string" ? response.body : JSON.stringify(response.body ?? {});
    return { ok: response.ok ?? true, status: response.status ?? 200, text: async () => text } as Response;
  }) as unknown as typeof fetch;
  return { impl, calls };
}

describe("ResendClient", () => {
  it("exige apiKey", () => {
    expect(() => new ResendClient({ apiKey: "" })).toThrow();
  });

  it("hace POST a api.resend.com/emails con Bearer y el body", async () => {
    const { impl, calls } = fakeFetch({ body: { id: "email-1" } });
    const client = new ResendClient({ apiKey: "re_test", fetchImpl: impl });

    const res = await client.sendEmail({
      from: "Demo <f@demo.mx>",
      to: ["cliente@correo.com"],
      subject: "Tu factura",
      html: "<p>hola</p>",
      attachments: [{ filename: "f.xml", content: "YmFzZTY0", content_type: "application/xml" }],
    });

    expect(res.id).toBe("email-1");
    expect(calls[0].url).toBe("https://api.resend.com/emails");
    expect(calls[0].init.method).toBe("POST");
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    const sent = JSON.parse(calls[0].init.body as string);
    expect(sent.to).toEqual(["cliente@correo.com"]);
    expect(sent.attachments[0]).toMatchObject({ filename: "f.xml", content: "YmFzZTY0" });
  });

  it("lanza EmailError con el mensaje de Resend ante fallo", async () => {
    const { impl } = fakeFetch({ ok: false, status: 422, body: { message: "Invalid `to` field" } });
    const client = new ResendClient({ apiKey: "re_test", fetchImpl: impl });
    await expect(
      client.sendEmail({ from: "a@b.mx", to: ["x"], subject: "s", html: "h" }),
    ).rejects.toMatchObject({ name: "EmailError", statusCode: 422, message: "Invalid `to` field" });
  });

  it("EmailError es instancia de Error", async () => {
    const { impl } = fakeFetch({ ok: false, status: 500, body: {} });
    const client = new ResendClient({ apiKey: "re_test", fetchImpl: impl });
    await expect(client.sendEmail({ from: "a@b.mx", to: ["x"], subject: "s", html: "h" })).rejects.toBeInstanceOf(
      EmailError,
    );
  });
});
