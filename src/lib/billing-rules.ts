// Módulo `billing-rules` (puro): validaciones de formato (RFC, CP, catálogos) y
// la regla de ventana de facturación. Se ejecuta ANTES de llamar al PAC para
// fallar rápido y barato. Sin dependencias de BD ni red.

import { z } from "zod";

// --- RFC ---

// Persona moral: 3 letras + 6 dígitos (fecha) + 3 alfanuméricos (homoclave) = 12.
// Persona física: 4 letras + 6 dígitos + 3 alfanuméricos = 13.
const RFC_MORAL = /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/;
const RFC_FISICA = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/;

export type TipoPersona = "moral" | "fisica";

/** Normaliza un RFC para validación (mayúsculas, sin espacios). */
export function normalizarRfc(rfc: string): string {
  return rfc.trim().toUpperCase();
}

export function tipoPersona(rfc: string): TipoPersona | null {
  const r = normalizarRfc(rfc);
  if (r.length === 12 && RFC_MORAL.test(r)) return "moral";
  if (r.length === 13 && RFC_FISICA.test(r)) return "fisica";
  return null;
}

/** ¿El RFC tiene formato válido (persona moral 12 o física 13)? */
export function esRfcValido(rfc: string): boolean {
  return tipoPersona(rfc) !== null;
}

// --- CP ---

const CP = /^\d{5}$/;

/** ¿El código postal es de 5 dígitos? */
export function esCpValido(cp: string): boolean {
  return CP.test(cp.trim());
}

// --- Catálogos ---

/** ¿La clave pertenece al catálogo dado? */
export function perteneceACatalogo(
  clave: string,
  catalogo: Iterable<string>,
): boolean {
  const set = catalogo instanceof Set ? catalogo : new Set(catalogo);
  return set.has(clave);
}

// --- Schema del receptor (formato + pertenencia a catálogos) ---

export interface CatalogosValidos {
  regimenFiscal: Iterable<string>;
  usoCfdi: Iterable<string>;
  formaPago: Iterable<string>;
}

/**
 * Construye un schema Zod que valida los datos fiscales del receptor: formato
 * de RFC/CP y pertenencia de las claves elegidas a los catálogos vigentes.
 */
export function receptorSchema(catalogos: CatalogosValidos) {
  const regimen = new Set(catalogos.regimenFiscal);
  const uso = new Set(catalogos.usoCfdi);
  const forma = new Set(catalogos.formaPago);

  return z.object({
    rfc: z
      .string()
      .transform(normalizarRfc)
      .refine(esRfcValido, "RFC con formato inválido (debe ser 12 o 13 caracteres)."),
    nombre: z.string().trim().min(1, "El nombre/razón social es obligatorio."),
    cp: z.string().refine(esCpValido, "El CP debe tener 5 dígitos."),
    regimenFiscal: z
      .string()
      .refine((c) => regimen.has(c), "Régimen fiscal fuera de catálogo."),
    usoCfdi: z.string().refine((c) => uso.has(c), "Uso de CFDI fuera de catálogo."),
    formaPago: z
      .string()
      .refine((c) => forma.has(c), "Forma de pago fuera de catálogo."),
    email: z.string().email("Correo inválido."),
  });
}

// --- Ventana de facturación ---

export type VentanaPolitica = "MISMO_MES";

export interface ResultadoVentana {
  ok: boolean;
  motivo?: string;
}

/**
 * ¿La fecha del ticket cae dentro de la ventana de facturación? F1 soporta
 * "MISMO_MES" (mismo mes calendario que `ahora`). Configurable por emisor.
 */
export function dentroDeVentana(
  fechaTicket: Date,
  ahora: Date,
  politica: VentanaPolitica = "MISMO_MES",
): ResultadoVentana {
  if (Number.isNaN(fechaTicket.getTime())) {
    return { ok: false, motivo: "La fecha del ticket no es válida." };
  }
  switch (politica) {
    case "MISMO_MES": {
      const mismoMes =
        fechaTicket.getFullYear() === ahora.getFullYear() &&
        fechaTicket.getMonth() === ahora.getMonth();
      return mismoMes
        ? { ok: true }
        : {
            ok: false,
            motivo:
              "La fecha del ticket está fuera de la ventana de facturación (mismo mes calendario).",
          };
    }
  }
}
