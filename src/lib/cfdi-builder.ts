// Módulo `cfdi-builder` (puro): arma el payload CFDI 4.0 para la API Multiemisor
// de Facturama (POST api-lite/3/cfdis) desde la config del emisor + receptor +
// monto + concepto. Aplica los defaults fijos y el traslado de IVA. Usa `tax`.
//
// Nombres de campo verificados contra el SDK oficial de Facturama (CfdiMulti):
//   { Issuer{Rfc,Name,FiscalRegime}, CfdiType, PaymentForm, PaymentMethod,
//     Currency, ExpeditionPlace, Exportation, Folio, Items[], Receiver{...} }

import { desglosarIva } from "./tax";

// --- Entradas (dominio ERP YOU) ---

export interface ConceptoEmisor {
  claveProdServ: string;
  claveUnidad: string;
  descripcion: string;
  tasaIva: number;
  /** Unidad legible (opcional; ClaveUnidad es el código SAT obligatorio). */
  unidad?: string;
}

export interface EmisorCfdi {
  rfc: string;
  razonSocial: string;
  regimenFiscal: string;
  cpExpedicion: string;
  concepto: ConceptoEmisor;
}

export interface ReceptorCfdi {
  rfc: string;
  nombre: string;
  cp: string;
  regimenFiscal: string;
  usoCfdi: string;
}

export interface DatosComprobante {
  formaPago: string;
  folio: string;
  /** Total con IVA capturado por el cliente. */
  total: number;
}

export interface ConstruirCfdiInput {
  emisor: EmisorCfdi;
  receptor: ReceptorCfdi;
  comprobante: DatosComprobante;
}

// --- Salida (payload Facturama Multiemisor) ---

export interface CfdiTax {
  Name: "IVA";
  Base: number;
  Rate: number;
  Total: number;
  IsRetention: boolean;
  IsQuota: boolean;
}

export interface CfdiItem {
  ProductCode: string;
  UnitCode: string;
  Unit?: string;
  Description: string;
  Quantity: number;
  UnitPrice: number;
  Subtotal: number;
  TaxObject: string;
  Total: number;
  Taxes: CfdiTax[];
}

export interface CfdiReceiver {
  Rfc: string;
  Name: string;
  CfdiUse: string;
  FiscalRegime: string;
  TaxZipCode: string;
}

export interface CfdiIssuer {
  Rfc: string;
  Name: string;
  FiscalRegime: string;
}

export interface CfdiMultiPayload {
  Issuer: CfdiIssuer;
  CfdiType: "I";
  PaymentForm: string;
  PaymentMethod: "PUE";
  Currency: "MXN";
  ExpeditionPlace: string;
  Exportation: string;
  Folio: string;
  Receiver: CfdiReceiver;
  Items: CfdiItem[];
}

// Defaults fijos del CFDI de ingreso de contado (User Story 27 del PRD).
const DEFAULTS = {
  CfdiType: "I",
  PaymentMethod: "PUE",
  Currency: "MXN",
  Exportation: "01",
  /** ObjetoImp = 02 (sí objeto de impuesto). */
  TaxObject: "02",
} as const;

/**
 * Construye el payload CFDI 4.0 Multiemisor. El total capturado (con IVA) se
 * desglosa con `tax` y entra como un único concepto genérico del emisor.
 */
export function construirCfdi(input: ConstruirCfdiInput): CfdiMultiPayload {
  const { emisor, receptor, comprobante } = input;
  const { concepto } = emisor;

  const { subtotal, iva, total, tasa } = desglosarIva(
    comprobante.total,
    concepto.tasaIva,
  );

  const item: CfdiItem = {
    ProductCode: concepto.claveProdServ,
    UnitCode: concepto.claveUnidad,
    ...(concepto.unidad ? { Unit: concepto.unidad } : {}),
    Description: concepto.descripcion,
    Quantity: 1,
    UnitPrice: subtotal,
    Subtotal: subtotal,
    TaxObject: DEFAULTS.TaxObject,
    Total: total,
    Taxes: [
      {
        Name: "IVA",
        Base: subtotal,
        Rate: tasa,
        Total: iva,
        IsRetention: false,
        IsQuota: false,
      },
    ],
  };

  return {
    Issuer: {
      Rfc: emisor.rfc,
      Name: emisor.razonSocial,
      FiscalRegime: emisor.regimenFiscal,
    },
    CfdiType: DEFAULTS.CfdiType,
    PaymentForm: comprobante.formaPago,
    PaymentMethod: DEFAULTS.PaymentMethod,
    Currency: DEFAULTS.Currency,
    ExpeditionPlace: emisor.cpExpedicion,
    Exportation: DEFAULTS.Exportation,
    Folio: comprobante.folio,
    Receiver: {
      Rfc: receptor.rfc,
      Name: receptor.nombre,
      CfdiUse: receptor.usoCfdi,
      FiscalRegime: receptor.regimenFiscal,
      TaxZipCode: receptor.cp,
    },
    Items: [item],
  };
}
