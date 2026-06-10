// Estado de resultados (P&L) — módulo puro. Recibe filas planas ya filtradas por
// periodo/tienda y arma la estructura. El costo de ventas viene del CPM ya
// registrado en cada venta del POS; los ingresos/devoluciones vienen firmados.

import { Decimal, toDecimal, type DecimalLike } from "./money";

export type TipoER =
  | "GASTO_OPERATIVO_ADMIN"
  | "GASTO_OPERATIVO_VENTAS"
  | "OTRO_GASTO"
  | "OTRO_INGRESO"
  | "GASTO_FINANCIERO"
  | "INGRESO_FINANCIERO"
  | "IMPUESTO";

export interface VentaResumen {
  /// Subtotal sin IVA (firmado: las devoluciones ya vienen negativas).
  subtotalSinIva: DecimalLike;
  comisionMonto: DecimalLike;
  /// Costo de ventas (COGS al CPM, firmado).
  costo: DecimalLike;
}

export interface GastoResumen {
  tipoER: TipoER;
  monto: DecimalLike;
  /// ISR retenido del gasto (se suma a impuestos).
  isr?: DecimalLike;
}

export interface EstadoResultados {
  ingresosNetos: Decimal;
  costoVentas: Decimal;
  comisiones: Decimal;
  utilidadBruta: Decimal;
  gastosOperativosAdmin: Decimal;
  gastosOperativosVentas: Decimal;
  ebit: Decimal;
  otrosIngresos: Decimal;
  otrosGastos: Decimal;
  ingresosFinancieros: Decimal;
  gastosFinancieros: Decimal;
  uai: Decimal;
  impuestos: Decimal;
  utilidadNeta: Decimal;
  margenBruto: Decimal;
  margenOperativo: Decimal;
  margenNeto: Decimal;
}

export function construirEstadoResultados(
  ventas: VentaResumen[],
  gastos: GastoResumen[],
): EstadoResultados {
  const sum = (xs: DecimalLike[]): Decimal => xs.reduce<Decimal>((t, x) => t.plus(toDecimal(x)), new Decimal(0));
  const porTipo = (t: TipoER): Decimal => sum(gastos.filter((g) => g.tipoER === t).map((g) => g.monto));

  const ingresosNetos = sum(ventas.map((v) => v.subtotalSinIva));
  const costoVentas = sum(ventas.map((v) => v.costo));
  const comisiones = sum(ventas.map((v) => v.comisionMonto));
  const utilidadBruta = ingresosNetos.minus(costoVentas).minus(comisiones);

  const gastosOperativosAdmin = porTipo("GASTO_OPERATIVO_ADMIN");
  const gastosOperativosVentas = porTipo("GASTO_OPERATIVO_VENTAS");
  const ebit = utilidadBruta.minus(gastosOperativosAdmin).minus(gastosOperativosVentas);

  const otrosIngresos = porTipo("OTRO_INGRESO");
  const otrosGastos = porTipo("OTRO_GASTO");
  const ingresosFinancieros = porTipo("INGRESO_FINANCIERO");
  const gastosFinancieros = porTipo("GASTO_FINANCIERO");
  const uai = ebit.plus(otrosIngresos).minus(otrosGastos).plus(ingresosFinancieros).minus(gastosFinancieros);

  const impuestos = porTipo("IMPUESTO").plus(sum(gastos.map((g) => g.isr ?? 0)));
  const utilidadNeta = uai.minus(impuestos);

  const pct = (x: Decimal) =>
    ingresosNetos.isZero() ? new Decimal(0) : x.div(ingresosNetos).mul(100).toDecimalPlaces(2);

  return {
    ingresosNetos,
    costoVentas,
    comisiones,
    utilidadBruta,
    gastosOperativosAdmin,
    gastosOperativosVentas,
    ebit,
    otrosIngresos,
    otrosGastos,
    ingresosFinancieros,
    gastosFinancieros,
    uai,
    impuestos,
    utilidadNeta,
    margenBruto: pct(utilidadBruta),
    margenOperativo: pct(ebit),
    margenNeto: pct(utilidadNeta),
  };
}
