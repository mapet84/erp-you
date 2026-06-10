// CLI de alta de usuario del ERP (Fase 2, rebanada #1 — sin panel admin todavía).
//
// Crea o actualiza un usuario con contraseña hasheada (bcrypt). Sirve para crear
// el primer administrador; la gestión por UI llega en la rebanada #2.
//
// Uso:
//   npm run usuario:alta -- --email admin@empresa.mx --nombre "Admin" --password "secreta123"
//   npm run usuario:alta -- --email admin@empresa.mx --nombre "Admin" --password "nueva" --reactivar
//
// Requiere DATABASE_URL en el entorno (se carga vía --env-file=.env).

import { parseArgs } from "node:util";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function parse() {
  const { values } = parseArgs({
    options: {
      email: { type: "string" },
      nombre: { type: "string" },
      password: { type: "string" },
      reactivar: { type: "boolean", default: false },
    },
  });
  const faltantes = (["email", "nombre", "password"] as const).filter(
    (k) => !values[k],
  );
  if (faltantes.length) {
    console.error(`Faltan argumentos requeridos: ${faltantes.join(", ")}`);
    console.error("Uso: npm run usuario:alta -- --email <correo> --nombre <nombre> --password <contraseña>");
    process.exit(1);
  }
  if ((values.password as string).length < 8) {
    console.error("La contraseña debe tener al menos 8 caracteres.");
    process.exit(1);
  }
  return values;
}

async function main() {
  const v = parse();
  const email = (v.email as string).toLowerCase().trim();
  const passwordHash = await bcrypt.hash(v.password as string, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      nombre: v.nombre as string,
      passwordHash,
      ...(v.reactivar ? { activo: true } : {}),
    },
    create: {
      email,
      nombre: v.nombre as string,
      passwordHash,
      activo: true,
    },
  });

  console.log(`✔ Usuario "${user.email}" listo (id ${user.id}). Inicia sesión en /login`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(`\n✖ Error: ${e.message}`);
    await prisma.$disconnect();
    process.exit(1);
  });
