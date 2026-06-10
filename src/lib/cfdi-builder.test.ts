import { describe, it, expect } from "vitest";
import { construirCfdi, type ConstruirCfdiInput } from "./cfdi-builder";

const emisorMoral: ConstruirCfdiInput["emisor"] = {
  rfc: "EKU9003173C9", // 12 = persona moral
  razonSocial: "Panadería Demo SA de CV",
  regimenFiscal: "601",
  cpExpedicion: "64000",
  concepto: {
    claveProdServ: "90111501",
    claveUnidad: "E48",
    descripcion: "Consumo de alimentos",
    tasaIva: 0.16,
  },
};

const receptorFisica: ConstruirCfdiInput["receptor"] = {
  rfc: "XAXX010101000", // 13 chars (genérico) → persona física
  nombre: "Juan Pérez",
  cp: "06000",
  regimenFiscal: "612",
  usoCfdi: "G03",
};

const base: ConstruirCfdiInput = {
  emisor: emisorMoral,
  receptor: receptorFisica,
  comprobante: { formaPago: "01", folio: "A-123", total: 116 },
};

describe("construirCfdi · defaults fijos", () => {
  const cfdi = construirCfdi(base);

  it("fija CfdiType=I, PaymentMethod=PUE, Currency=MXN, Exportation=01", () => {
    expect(cfdi.CfdiType).toBe("I");
    expect(cfdi.PaymentMethod).toBe("PUE");
    expect(cfdi.Currency).toBe("MXN");
    expect(cfdi.Exportation).toBe("01");
  });

  it("toma FormaPago, Folio y LugarExpedicion de las entradas", () => {
    expect(cfdi.PaymentForm).toBe("01");
    expect(cfdi.Folio).toBe("A-123");
    expect(cfdi.ExpeditionPlace).toBe("64000");
  });
});

describe("construirCfdi · emisor y receptor", () => {
  const cfdi = construirCfdi(base);

  it("mapea el Issuer desde el emisor", () => {
    expect(cfdi.Issuer).toEqual({
      Rfc: "EKU9003173C9",
      Name: "Panadería Demo SA de CV",
      FiscalRegime: "601",
    });
  });

  it("mapea el Receiver desde el receptor", () => {
    expect(cfdi.Receiver).toEqual({
      Rfc: "XAXX010101000",
      Name: "Juan Pérez",
      CfdiUse: "G03",
      FiscalRegime: "612",
      TaxZipCode: "06000",
    });
  });
});

describe("construirCfdi · concepto y traslado de IVA", () => {
  const cfdi = construirCfdi(base);
  const item = cfdi.Items[0];

  it("usa el concepto genérico del emisor", () => {
    expect(cfdi.Items).toHaveLength(1);
    expect(item.ProductCode).toBe("90111501");
    expect(item.UnitCode).toBe("E48");
    expect(item.Description).toBe("Consumo de alimentos");
    expect(item.Quantity).toBe(1);
    expect(item.TaxObject).toBe("02");
  });

  it("desglosa 116 → subtotal 100 + IVA 16 y cuadra el total", () => {
    expect(item.Subtotal).toBe(100);
    expect(item.UnitPrice).toBe(100);
    expect(item.Total).toBe(116);
    const tax = item.Taxes[0];
    expect(tax).toEqual({
      Name: "IVA",
      Base: 100,
      Rate: 0.16,
      Total: 16,
      IsRetention: false,
      IsQuota: false,
    });
    expect(item.Subtotal + tax.Total).toBe(item.Total);
  });

  it("reconcilia centavos en montos que no son redondos (100.00)", () => {
    const cfdi2 = construirCfdi({
      ...base,
      comprobante: { ...base.comprobante, total: 100 },
    });
    const it2 = cfdi2.Items[0];
    expect(it2.Subtotal).toBe(86.21);
    expect(it2.Taxes[0].Total).toBe(13.79);
    expect(it2.Subtotal + it2.Taxes[0].Total).toBe(100);
  });
});

describe("construirCfdi · persona moral (RFC 12) y física (RFC 13)", () => {
  it("acepta receptor persona moral (RFC 12)", () => {
    const cfdi = construirCfdi({
      ...base,
      receptor: { ...receptorFisica, rfc: "ABC123456T1A".slice(0, 12) },
    });
    expect(cfdi.Receiver.Rfc).toHaveLength(12);
  });

  it("acepta receptor persona física (RFC 13)", () => {
    const cfdi = construirCfdi({
      ...base,
      receptor: { ...receptorFisica, rfc: "XAXX010101000" },
    });
    expect(cfdi.Receiver.Rfc).toHaveLength(13);
  });
});
