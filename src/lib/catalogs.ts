// Catálogos del SAT (subconjunto curado para el camino feliz del slice #3).
//
// Son los mínimos para poblar los <select> del formulario y validar contra
// `billing-rules`. El slice #6 los reemplaza por los catálogos completos del SAT.

export interface OpcionCatalogo {
  clave: string;
  descripcion: string;
}

/** c_RegimenFiscal — regímenes comunes de persona física y moral. */
export const REGIMENES_FISCALES: OpcionCatalogo[] = [
  { clave: "601", descripcion: "General de Ley Personas Morales" },
  { clave: "603", descripcion: "Personas Morales con Fines no Lucrativos" },
  { clave: "605", descripcion: "Sueldos y Salarios e Ingresos Asimilados a Salarios" },
  { clave: "612", descripcion: "Personas Físicas con Actividades Empresariales y Profesionales" },
  { clave: "616", descripcion: "Sin obligaciones fiscales" },
  { clave: "626", descripcion: "Régimen Simplificado de Confianza" },
];

/** c_UsoCFDI — usos frecuentes en consumo de alimentos / gastos. */
export const USOS_CFDI: OpcionCatalogo[] = [
  { clave: "G01", descripcion: "Adquisición de mercancías" },
  { clave: "G03", descripcion: "Gastos en general" },
  { clave: "D01", descripcion: "Honorarios médicos, dentales y gastos hospitalarios" },
  { clave: "S01", descripcion: "Sin efectos fiscales" },
];

/** c_FormaPago — formas de pago de contado más usadas. */
export const FORMAS_PAGO: OpcionCatalogo[] = [
  { clave: "01", descripcion: "Efectivo" },
  { clave: "03", descripcion: "Transferencia electrónica de fondos" },
  { clave: "04", descripcion: "Tarjeta de crédito" },
  { clave: "28", descripcion: "Tarjeta de débito" },
  { clave: "02", descripcion: "Cheque nominativo" },
];

/** Conjuntos de claves válidas, para validar con `billing-rules.receptorSchema`. */
export const catalogosValidos = {
  regimenFiscal: REGIMENES_FISCALES.map((o) => o.clave),
  usoCfdi: USOS_CFDI.map((o) => o.clave),
  formaPago: FORMAS_PAGO.map((o) => o.clave),
};
