// CLI de alta de emisor (Fase 1, sin panel admin).
//
// Lee el CSD (.cer/.key + contraseña), lo carga en Facturama Multiemisor por RFC
// y persiste/actualiza el registro Emisor con su config fiscal y de marca.
//
// Uso:
//   npm run emisor:alta -- \
//     --slug demo --rfc EKU9003173C9 --razon-social "Panadería Demo SA de CV" \
//     --regimen 601 --cp-expedicion 64000 \
//     --cer ./csd/demo.cer --key ./csd/demo.key --key-pass 12345678a \
//     --clave-prodserv 90111501 --clave-unidad E48 --descripcion "Consumo de alimentos" \
//     --tasa-iva 0.16 --nombre-comercial "Panadería Demo" --color "#b45309"
//
// Requiere en el entorno: FACTURAMA_USER, FACTURAMA_PASSWORD, FACTURAMA_ENV (default sandbox).

import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { PrismaClient } from "@prisma/client";
import { facturamaClientFromEnv } from "../src/lib/facturama/config";

const prisma = new PrismaClient();

const REQUIRED = [
  "slug",
  "rfc",
  "razon-social",
  "regimen",
  "cp-expedicion",
  "cer",
  "key",
  "key-pass",
  "clave-prodserv",
  "clave-unidad",
  "descripcion",
] as const;

function parse() {
  const { values } = parseArgs({
    options: {
      slug: { type: "string" },
      rfc: { type: "string" },
      "razon-social": { type: "string" },
      regimen: { type: "string" },
      "cp-expedicion": { type: "string" },
      cer: { type: "string" },
      key: { type: "string" },
      "key-pass": { type: "string" },
      "clave-prodserv": { type: "string" },
      "clave-unidad": { type: "string" },
      descripcion: { type: "string" },
      "tasa-iva": { type: "string", default: "0.16" },
      "nombre-comercial": { type: "string" },
      color: { type: "string" },
      ventana: { type: "string", default: "MISMO_MES" },
    },
  });

  const faltantes = REQUIRED.filter((k) => !values[k]);
  if (faltantes.length) {
    console.error(`Faltan argumentos requeridos: ${faltantes.join(", ")}`);
    console.error("Ver el encabezado de scripts/alta-emisor.ts para el uso.");
    process.exit(1);
  }
  return values;
}

function fileToBase64(path: string): string {
  try {
    return readFileSync(path).toString("base64");
  } catch (e) {
    throw new Error(`No se pudo leer el archivo "${path}": ${(e as Error).message}`);
  }
}

async function main() {
  const v = parse();
  const rfc = v.rfc!.toUpperCase();

  // 1. Cargar el CSD en Facturama (da de alta el emisor por RFC).
  const facturama = facturamaClientFromEnv();
  const certificateBase64 = fileToBase64(v.cer!);
  const privateKeyBase64 = fileToBase64(v.key!);

  console.log(`Cargando CSD de ${rfc} en Facturama…`);
  const csd = await facturama.uploadCsd({
    rfc,
    certificateBase64,
    privateKeyBase64,
    privateKeyPassword: v["key-pass"]!,
  });
  console.log(`✔ CSD cargado (RFC ${csd.Rfc ?? rfc}).`);

  // 2. Persistir / actualizar el Emisor con su config fiscal y de marca.
  const conceptoDefault = {
    claveProdServ: v["clave-prodserv"]!,
    claveUnidad: v["clave-unidad"]!,
    descripcion: v.descripcion!,
    tasaIva: Number(v["tasa-iva"]),
  };
  const branding: Record<string, string> = {};
  if (v["nombre-comercial"]) branding.nombreComercial = v["nombre-comercial"];
  if (v.color) branding.colorPrimario = v.color;

  const emisor = await prisma.emisor.upsert({
    where: { slug: v.slug! },
    update: {
      rfc,
      razonSocial: v["razon-social"]!,
      regimenFiscal: v.regimen!,
      cpExpedicion: v["cp-expedicion"]!,
      conceptoDefault,
      ventanaFacturacion: v.ventana!,
      facturamaIssuerRef: csd.Rfc ?? rfc,
      branding,
      activo: true,
    },
    create: {
      slug: v.slug!,
      rfc,
      razonSocial: v["razon-social"]!,
      regimenFiscal: v.regimen!,
      cpExpedicion: v["cp-expedicion"]!,
      conceptoDefault,
      ventanaFacturacion: v.ventana!,
      facturamaIssuerRef: csd.Rfc ?? rfc,
      branding,
      activo: true,
    },
  });

  console.log(`✔ Emisor "${emisor.slug}" listo → portal en /f/${emisor.slug}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(`\n✖ Error: ${e.message}`);
    await prisma.$disconnect();
    process.exit(1);
  });
