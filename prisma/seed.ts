import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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
