// Genera una corrida de pronóstico desde VentaSemanal: por artículo proyecta
// unidades/ventas/costo y explota recetas a compras de ingredientes (BOM).

import type { MetodoPronostico } from "@prisma/client";
import { prisma } from "@/lib/db";
import { Decimal } from "./money";
import {
  pronosticarUnidades,
  factorTendencia,
  redondearMinCompra,
  ocurrenciasEnHorizonte,
  type MetodoPonderacion,
  type Periodicidad,
} from "./forecast";
import { datosPOSPorReceta } from "./costeo.server";

export interface ParamsPronostico {
  metodo: MetodoPonderacion;
  semanasHistoria: number;
  horizonteSemanas: number;
  usaTendencia: boolean;
  usaEstacional: boolean;
  crecimiento: number;
}

export async function generarPronostico(tiendaId: string, p: ParamsPronostico): Promise<string> {
  const metodoEnum = p.metodo.toUpperCase() as MetodoPronostico;

  const vs = await prisma.ventaSemanal.findMany({
    where: { tiendaId },
    orderBy: [{ anio: "asc" }, { semana: "asc" }],
  });

  const porCodigo = new Map<string, { articulo: string; serie: number[]; ventas: Decimal; costo: Decimal; unidades: Decimal }>();
  for (const r of vs) {
    let g = porCodigo.get(r.codigo);
    if (!g) {
      g = { articulo: r.articulo, serie: [], ventas: new Decimal(0), costo: new Decimal(0), unidades: new Decimal(0) };
      porCodigo.set(r.codigo, g);
    }
    g.serie.push(r.unidades.toNumber());
    g.ventas = g.ventas.plus(r.ventas);
    g.costo = g.costo.plus(r.costo);
    g.unidades = g.unidades.plus(r.unidades);
  }

  const [recetas, ingredientes, datosReceta] = await Promise.all([
    prisma.receta.findMany({ select: { id: true, sku: true } }),
    prisma.ingrediente.findMany({ select: { codigo: true, nombre: true, costoCompra: true, minCompra: true } }),
    datosPOSPorReceta(tiendaId),
  ]);
  const skuToId = new Map(recetas.map((r) => [r.sku, r.id]));
  const ingMap = new Map(ingredientes.map((i) => [i.codigo, i]));

  const lineas: { codigo: string; articulo: string; unidades: Decimal; ventas: Decimal; costo: Decimal }[] = [];
  const comprasAcc = new Map<string, Decimal>();

  for (const [codigo, g] of porCodigo) {
    const serie = g.serie.slice(-p.semanasHistoria);
    const perWeek = pronosticarUnidades({
      serie,
      metodo: p.metodo,
      factorTendencia: p.usaTendencia ? factorTendencia(serie.slice(-4)) : 1,
      crecimiento: p.crecimiento,
    });
    const unidades = new Decimal(perWeek).mul(p.horizonteSemanas).toDecimalPlaces(4);
    if (unidades.lte(0)) continue;

    const precioProm = g.unidades.gt(0) ? g.ventas.div(g.unidades) : new Decimal(0);
    const costoProm = g.unidades.gt(0) ? g.costo.div(g.unidades) : new Decimal(0);
    lineas.push({
      codigo,
      articulo: g.articulo,
      unidades,
      ventas: unidades.mul(precioProm).toDecimalPlaces(2),
      costo: unidades.mul(costoProm).toDecimalPlaces(2),
    });

    const recetaId = skuToId.get(codigo);
    if (recetaId) {
      for (const e of datosReceta.get(recetaId)?.explosion ?? []) {
        comprasAcc.set(e.codigo, (comprasAcc.get(e.codigo) ?? new Decimal(0)).plus(e.qty.mul(unidades)));
      }
    } else {
      comprasAcc.set(codigo, (comprasAcc.get(codigo) ?? new Decimal(0)).plus(unidades));
    }
  }

  const compras = [...comprasAcc].map(([codigo, cantidad]) => {
    const ing = ingMap.get(codigo);
    const min = ing?.minCompra ?? new Decimal(0);
    const cantidadRedondeada = redondearMinCompra(cantidad, min);
    const costoUnit = ing?.costoCompra ?? new Decimal(0);
    return {
      ingredienteCodigo: codigo,
      nombre: ing?.nombre ?? codigo,
      cantidad: cantidad.toDecimalPlaces(4),
      cantidadRedondeada,
      costoEstimado: cantidadRedondeada.mul(costoUnit).toDecimalPlaces(2),
    };
  });

  // Proyección de gastos recurrentes (no UNICA) que caen en el horizonte.
  const gastosHist = await prisma.gasto.findMany({
    where: { periodicidad: { not: "UNICA" }, OR: [{ tiendaId }, { tiendaId: null }] },
    include: { categoriaGasto: true },
  });
  const grupos = new Map<string, { categoria: string; periodicidad: Periodicidad; suma: Decimal; n: number }>();
  for (const g of gastosHist) {
    const key = `${g.categoriaGasto.nombre}|${g.periodicidad}`;
    let x = grupos.get(key);
    if (!x) {
      x = { categoria: g.categoriaGasto.nombre, periodicidad: g.periodicidad as Periodicidad, suma: new Decimal(0), n: 0 };
      grupos.set(key, x);
    }
    x.suma = x.suma.plus(g.monto);
    x.n += 1;
  }
  const gastos = [...grupos.values()]
    .map((x) => {
      const ocurrencias = ocurrenciasEnHorizonte(x.periodicidad, p.horizonteSemanas);
      const promedio = x.n > 0 ? x.suma.div(x.n) : new Decimal(0);
      return { categoria: x.categoria, periodicidad: x.periodicidad, ocurrencias, monto: promedio.mul(ocurrencias).toDecimalPlaces(2) };
    })
    .filter((g) => g.ocurrencias > 0);

  const pron = await prisma.pronostico.create({
    data: {
      tiendaId,
      metodo: metodoEnum,
      semanasHistoria: p.semanasHistoria,
      horizonteSemanas: p.horizonteSemanas,
      usaEstacional: p.usaEstacional,
      usaTendencia: p.usaTendencia,
      crecimiento: p.crecimiento.toString(),
      lineas: { create: lineas },
      compras: { create: compras },
      gastos: { create: gastos },
    },
  });
  return pron.id;
}
