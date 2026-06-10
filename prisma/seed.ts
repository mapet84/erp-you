import { PrismaClient } from "@prisma/client";
import { REGIMENES_FISCALES, USOS_CFDI, FORMAS_PAGO } from "../src/lib/catalogs";

const prisma = new PrismaClient();

async function seedCatalogos() {
  const grupos = [
    { tipo: "regimenFiscal", opciones: REGIMENES_FISCALES },
    { tipo: "usoCfdi", opciones: USOS_CFDI },
    { tipo: "formaPago", opciones: FORMAS_PAGO },
  ];
  let n = 0;
  for (const { tipo, opciones } of grupos) {
    for (const [orden, o] of opciones.entries()) {
      await prisma.catalogoSat.upsert({
        where: { tipo_clave: { tipo, clave: o.clave } },
        update: { descripcion: o.descripcion, orden },
        create: { tipo, clave: o.clave, descripcion: o.descripcion, orden },
      });
      n++;
    }
  }
  console.log(`Catálogos SAT sembrados: ${n} claves (regímenes, usos CFDI, formas de pago).`);
}

// Catálogos base del ERP (Fase 2). Idempotente. Datos de infraestructura
// (unidades, categorías, canales, medios); el alta de negocio es por la UI.
async function seedErp() {
  const unidades = [
    { codigo: "KG", nombre: "Kilogramo" },
    { codigo: "G", nombre: "Gramo" },
    { codigo: "L", nombre: "Litro" },
    { codigo: "ML", nombre: "Mililitro" },
    { codigo: "PZA", nombre: "Pieza" },
  ];
  for (const u of unidades) {
    await prisma.unidad.upsert({ where: { codigo: u.codigo }, update: { nombre: u.nombre }, create: u });
  }
  const categorias = ["Postres", "Bebidas", "Panadería"];
  for (const nombre of categorias) {
    await prisma.categoria.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }
  const canales = ["Tienda", "Uber"];
  for (const nombre of canales) {
    await prisma.canal.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }
  const tamanos = ["Individual", "Familiar"];
  for (const nombre of tamanos) {
    await prisma.tamano.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }
  const medios = ["Efectivo", "Tarjeta"];
  for (const nombre of medios) {
    await prisma.medioPago.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }
  const mediosCompra = [
    { nombre: "Contado", diasCredito: 0 },
    { nombre: "Crédito 30", diasCredito: 30 },
  ];
  for (const m of mediosCompra) {
    await prisma.medioCompra.upsert({ where: { nombre: m.nombre }, update: { diasCredito: m.diasCredito }, create: m });
  }
  const catGasto: { nombre: string; tipoER: "GASTO_OPERATIVO_ADMIN" | "GASTO_OPERATIVO_VENTAS" | "GASTO_FINANCIERO" | "IMPUESTO"; ivaPct: number; isrPct: number }[] = [
    { nombre: "Renta", tipoER: "GASTO_OPERATIVO_ADMIN", ivaPct: 16, isrPct: 0 },
    { nombre: "Nómina", tipoER: "GASTO_OPERATIVO_ADMIN", ivaPct: 0, isrPct: 0 },
    { nombre: "Servicios", tipoER: "GASTO_OPERATIVO_ADMIN", ivaPct: 16, isrPct: 0 },
    { nombre: "Publicidad", tipoER: "GASTO_OPERATIVO_VENTAS", ivaPct: 16, isrPct: 0 },
    { nombre: "Comisiones bancarias", tipoER: "GASTO_FINANCIERO", ivaPct: 16, isrPct: 0 },
    { nombre: "Impuestos", tipoER: "IMPUESTO", ivaPct: 0, isrPct: 0 },
  ];
  for (const c of catGasto) {
    await prisma.categoriaGasto.upsert({ where: { nombre: c.nombre }, update: { tipoER: c.tipoER, ivaPct: c.ivaPct, isrPct: c.isrPct }, create: c });
  }
  console.log(
    `ERP: ${unidades.length} unidades, ${categorias.length} categorías, ${canales.length} canales, ${tamanos.length} tamaños, ${medios.length} medios, ${catGasto.length} cat. gasto.`,
  );
}

async function main() {
  await seedCatalogos();
  await seedErp();

  // Emisor demo activo → /f/demo renderiza.
  await prisma.emisor.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      slug: "demo",
      rfc: "EKU9003173C9", // RFC de pruebas del SAT
      razonSocial: "Panadería Demo SA de CV",
      activo: true,
      branding: {
        nombreComercial: "Panadería Demo",
        colorPrimario: "#b45309",
      },
    },
  });

  // Emisor inactivo → /f/inactivo devuelve 404 (demuestra el candado de activo).
  await prisma.emisor.upsert({
    where: { slug: "inactivo" },
    update: {},
    create: {
      slug: "inactivo",
      rfc: "XAXX010101000",
      razonSocial: "Emisor Inactivo SA de CV",
      activo: false,
      branding: {},
    },
  });

  console.log("Seed OK → /f/demo (activo) · /f/inactivo (404) · /f/loquesea (404)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
