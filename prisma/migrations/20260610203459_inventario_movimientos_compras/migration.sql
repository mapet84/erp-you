-- CreateEnum
CREATE TYPE "erp"."TipoItem" AS ENUM ('INGREDIENTE', 'PRODUCTO');

-- CreateEnum
CREATE TYPE "erp"."TipoMovimiento" AS ENUM ('COMPRA', 'VENTA', 'DEVOLUCION', 'AJUSTE', 'MERMA');

-- CreateEnum
CREATE TYPE "erp"."EstadoCompra" AS ENUM ('PENDIENTE', 'PAGADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "erp"."inventario" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "erp"."TipoItem" NOT NULL,
    "stock" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "cpm" DECIMAL(14,6) NOT NULL DEFAULT 0,
    "valorTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."movimientos" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoMovimiento" "erp"."TipoMovimiento" NOT NULL,
    "qty" DECIMAL(14,4) NOT NULL,
    "cpm" DECIMAL(14,6) NOT NULL,
    "costoTotal" DECIMAL(14,2) NOT NULL,
    "refTipo" TEXT,
    "refId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."medios_compra" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "diasCredito" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "medios_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."compras" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(14,4) NOT NULL,
    "costoUnitario" DECIMAL(14,6) NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,
    "medioCompraId" TEXT,
    "estado" "erp"."EstadoCompra" NOT NULL DEFAULT 'PENDIENTE',
    "fechaCompra" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaPago" TIMESTAMP(3),

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventario_tiendaId_codigo_key" ON "erp"."inventario"("tiendaId", "codigo");

-- CreateIndex
CREATE INDEX "movimientos_tiendaId_codigo_fecha_idx" ON "erp"."movimientos"("tiendaId", "codigo", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "medios_compra_nombre_key" ON "erp"."medios_compra"("nombre");

-- CreateIndex
CREATE INDEX "compras_tiendaId_fechaCompra_idx" ON "erp"."compras"("tiendaId", "fechaCompra");

-- AddForeignKey
ALTER TABLE "erp"."inventario" ADD CONSTRAINT "inventario_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "erp"."tiendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."movimientos" ADD CONSTRAINT "movimientos_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "erp"."tiendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."compras" ADD CONSTRAINT "compras_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "erp"."tiendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."compras" ADD CONSTRAINT "compras_medioCompraId_fkey" FOREIGN KEY ("medioCompraId") REFERENCES "erp"."medios_compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;
