// Consulta read-only de facturas por emisor, para soporte/auditoría (#9).
// Uso: npm run facturas:list -- --slug demo [--estatus timbrada|error] [--limit 50]

import { parseArgs } from "node:util";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const { values } = parseArgs({
    options: {
      slug: { type: "string" },
      estatus: { type: "string" },
      limit: { type: "string", default: "50" },
    },
  });
  if (!values.slug) {
    console.error("Falta --slug. Uso: npm run facturas:list -- --slug demo [--estatus error] [--limit 50]");
    process.exit(1);
  }

  const emisor = await prisma.emisor.findUnique({ where: { slug: values.slug } });
  if (!emisor) {
    console.error(`No existe el emisor "${values.slug}".`);
    process.exit(1);
  }

  const facturas = await prisma.invoice.findMany({
    where: {
      emisorId: emisor.id,
      ...(values.estatus ? { estatus: values.estatus } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: Number(values.limit),
    include: { files: { select: { tipo: true } } },
  });

  console.log(`\nFacturas de "${emisor.slug}" (${emisor.rfc}) — ${facturas.length} resultado(s):\n`);
  for (const f of facturas) {
    const archivos = f.files.map((a) => a.tipo).join(",") || "—";
    const marca = f.estatus === "timbrada" ? "✔" : "✖";
    console.log(
      `${marca} ${f.createdAt.toISOString().slice(0, 16).replace("T", " ")}  ` +
        `folio=${f.folioTicket.padEnd(12)} ${String(f.estatus).padEnd(9)} ` +
        `${f.receptorRfc.padEnd(14)} $${Number(f.total).toFixed(2).padStart(10)}  ` +
        `${f.uuid ?? f.errorPac ?? ""}  [${archivos}]`,
    );
  }
  console.log("");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
