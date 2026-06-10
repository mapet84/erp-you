-- CreateEnum
CREATE TYPE "erp"."Modulo" AS ENUM ('GESTION', 'POS', 'FINANZAS', 'PRONOSTICOS');

-- CreateEnum
CREATE TYPE "erp"."Rol" AS ENUM ('CONFIGURADOR', 'OPERATIVO', 'LECTOR');

-- AlterTable
ALTER TABLE "erp"."usuarios" ADD COLUMN     "esAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "erp"."tiendas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tiendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."usuario_modulo_rol" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modulo" "erp"."Modulo" NOT NULL,
    "rol" "erp"."Rol" NOT NULL,

    CONSTRAINT "usuario_modulo_rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."usuario_tienda" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,

    CONSTRAINT "usuario_tienda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tiendas_codigo_key" ON "erp"."tiendas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_modulo_rol_userId_modulo_key" ON "erp"."usuario_modulo_rol"("userId", "modulo");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_tienda_userId_tiendaId_key" ON "erp"."usuario_tienda"("userId", "tiendaId");

-- AddForeignKey
ALTER TABLE "erp"."usuario_modulo_rol" ADD CONSTRAINT "usuario_modulo_rol_userId_fkey" FOREIGN KEY ("userId") REFERENCES "erp"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."usuario_tienda" ADD CONSTRAINT "usuario_tienda_userId_fkey" FOREIGN KEY ("userId") REFERENCES "erp"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."usuario_tienda" ADD CONSTRAINT "usuario_tienda_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "erp"."tiendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
