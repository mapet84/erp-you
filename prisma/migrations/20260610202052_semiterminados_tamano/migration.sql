-- DropForeignKey
ALTER TABLE "erp"."receta_componentes" DROP CONSTRAINT "receta_componentes_ingredienteId_fkey";

-- AlterTable
ALTER TABLE "erp"."receta_componentes" ADD COLUMN     "semiTerminadoId" TEXT,
ALTER COLUMN "ingredienteId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "erp"."recetas" ADD COLUMN     "tamanoId" TEXT;

-- CreateTable
CREATE TABLE "erp"."tamanos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "tamanos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."semi_terminados" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semi_terminados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."semi_componentes" (
    "id" TEXT NOT NULL,
    "semiTerminadoId" TEXT NOT NULL,
    "ingredienteId" TEXT,
    "hijoId" TEXT,
    "cantidad" DECIMAL(14,4) NOT NULL,
    "rendimiento" DECIMAL(7,4) NOT NULL DEFAULT 100,

    CONSTRAINT "semi_componentes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tamanos_nombre_key" ON "erp"."tamanos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "semi_terminados_sku_key" ON "erp"."semi_terminados"("sku");

-- AddForeignKey
ALTER TABLE "erp"."recetas" ADD CONSTRAINT "recetas_tamanoId_fkey" FOREIGN KEY ("tamanoId") REFERENCES "erp"."tamanos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."semi_componentes" ADD CONSTRAINT "semi_componentes_semiTerminadoId_fkey" FOREIGN KEY ("semiTerminadoId") REFERENCES "erp"."semi_terminados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."semi_componentes" ADD CONSTRAINT "semi_componentes_ingredienteId_fkey" FOREIGN KEY ("ingredienteId") REFERENCES "erp"."ingredientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."semi_componentes" ADD CONSTRAINT "semi_componentes_hijoId_fkey" FOREIGN KEY ("hijoId") REFERENCES "erp"."semi_terminados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."receta_componentes" ADD CONSTRAINT "receta_componentes_ingredienteId_fkey" FOREIGN KEY ("ingredienteId") REFERENCES "erp"."ingredientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."receta_componentes" ADD CONSTRAINT "receta_componentes_semiTerminadoId_fkey" FOREIGN KEY ("semiTerminadoId") REFERENCES "erp"."semi_terminados"("id") ON DELETE SET NULL ON UPDATE CASCADE;
