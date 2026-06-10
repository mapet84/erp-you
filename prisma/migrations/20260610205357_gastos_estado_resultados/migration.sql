-- CreateEnum
CREATE TYPE "erp"."TipoER" AS ENUM ('GASTO_OPERATIVO_ADMIN', 'GASTO_OPERATIVO_VENTAS', 'OTRO_GASTO', 'OTRO_INGRESO', 'GASTO_FINANCIERO', 'INGRESO_FINANCIERO', 'IMPUESTO');

-- CreateEnum
CREATE TYPE "erp"."Periodicidad" AS ENUM ('UNICA', 'QUINCENAL', 'MENSUAL', 'BIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- CreateTable
CREATE TABLE "erp"."categorias_gasto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoER" "erp"."TipoER" NOT NULL,
    "cuenta" TEXT,
    "ivaPct" DECIMAL(7,4) NOT NULL DEFAULT 16,
    "isrPct" DECIMAL(7,4) NOT NULL DEFAULT 0,

    CONSTRAINT "categorias_gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."gastos" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoriaGastoId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,
    "iva" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "isr" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tiendaId" TEXT,
    "periodicidad" "erp"."Periodicidad" NOT NULL DEFAULT 'UNICA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_gasto_nombre_key" ON "erp"."categorias_gasto"("nombre");

-- CreateIndex
CREATE INDEX "gastos_fecha_idx" ON "erp"."gastos"("fecha");

-- AddForeignKey
ALTER TABLE "erp"."gastos" ADD CONSTRAINT "gastos_categoriaGastoId_fkey" FOREIGN KEY ("categoriaGastoId") REFERENCES "erp"."categorias_gasto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
