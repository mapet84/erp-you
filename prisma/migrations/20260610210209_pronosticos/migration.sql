-- CreateEnum
CREATE TYPE "erp"."MetodoPronostico" AS ENUM ('LINEAL', 'EXPONENCIAL', 'PLANO');

-- CreateEnum
CREATE TYPE "erp"."EstadoPronostico" AS ENUM ('BORRADOR', 'CONFIRMADO');

-- CreateTable
CREATE TABLE "erp"."ventas_semanales" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "semana" INTEGER NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "canalId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "articulo" TEXT NOT NULL,
    "ventas" DECIMAL(14,2) NOT NULL,
    "costo" DECIMAL(14,2) NOT NULL,
    "utilidad" DECIMAL(14,2) NOT NULL,
    "unidades" DECIMAL(14,4) NOT NULL,
    "transacciones" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ventas_semanales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."pronosticos" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "metodo" "erp"."MetodoPronostico" NOT NULL,
    "semanasHistoria" INTEGER NOT NULL,
    "horizonteSemanas" INTEGER NOT NULL,
    "usaEstacional" BOOLEAN NOT NULL DEFAULT false,
    "usaTendencia" BOOLEAN NOT NULL DEFAULT false,
    "crecimiento" DECIMAL(7,4) NOT NULL DEFAULT 1,
    "estado" "erp"."EstadoPronostico" NOT NULL DEFAULT 'BORRADOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pronosticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."pronostico_lineas" (
    "id" TEXT NOT NULL,
    "pronosticoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "articulo" TEXT NOT NULL,
    "unidades" DECIMAL(14,4) NOT NULL,
    "ventas" DECIMAL(14,2) NOT NULL,
    "costo" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "pronostico_lineas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."pronostico_compras" (
    "id" TEXT NOT NULL,
    "pronosticoId" TEXT NOT NULL,
    "ingredienteCodigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad" DECIMAL(14,4) NOT NULL,
    "cantidadRedondeada" DECIMAL(14,4) NOT NULL,
    "costoEstimado" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "pronostico_compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."pron_status" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "semana" INTEGER NOT NULL,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pron_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ventas_semanales_anio_semana_tiendaId_canalId_codigo_key" ON "erp"."ventas_semanales"("anio", "semana", "tiendaId", "canalId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "pron_status_anio_semana_key" ON "erp"."pron_status"("anio", "semana");

-- AddForeignKey
ALTER TABLE "erp"."pronostico_lineas" ADD CONSTRAINT "pronostico_lineas_pronosticoId_fkey" FOREIGN KEY ("pronosticoId") REFERENCES "erp"."pronosticos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."pronostico_compras" ADD CONSTRAINT "pronostico_compras_pronosticoId_fkey" FOREIGN KEY ("pronosticoId") REFERENCES "erp"."pronosticos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
