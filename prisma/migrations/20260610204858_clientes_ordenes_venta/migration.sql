-- CreateEnum
CREATE TYPE "erp"."EstadoEntrega" AS ENUM ('PENDIENTE', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "erp"."EstadoFactura" AS ENUM ('SIN_FACTURA', 'FACTURADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "erp"."EstadoCobro" AS ENUM ('PENDIENTE', 'PAGADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "erp"."clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rfc" TEXT,
    "correos" TEXT[],
    "telefono" TEXT,
    "diasPago" INTEGER,
    "dirFacturacion" TEXT,
    "dirEntrega" TEXT,
    "banco" TEXT,
    "clabe" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."ordenes_venta" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteId" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "totalPedido" DECIMAL(14,2) NOT NULL,
    "estadoEntrega" "erp"."EstadoEntrega" NOT NULL DEFAULT 'PENDIENTE',
    "estadoFactura" "erp"."EstadoFactura" NOT NULL DEFAULT 'SIN_FACTURA',
    "estadoCobro" "erp"."EstadoCobro" NOT NULL DEFAULT 'PENDIENTE',
    "fechaEntrega" TIMESTAMP(3),
    "fechaFacturacion" TIMESTAMP(3),
    "fechaPago" TIMESTAMP(3),
    "fechaPagoEstimada" TIMESTAMP(3),
    "folioFactura" TEXT,

    CONSTRAINT "ordenes_venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."orden_venta_lineas" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "articulo" TEXT NOT NULL,
    "qty" DECIMAL(14,4) NOT NULL,
    "precioUnit" DECIMAL(14,2) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "orden_venta_lineas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_venta_folio_key" ON "erp"."ordenes_venta"("folio");

-- CreateIndex
CREATE INDEX "ordenes_venta_tiendaId_fecha_idx" ON "erp"."ordenes_venta"("tiendaId", "fecha");

-- AddForeignKey
ALTER TABLE "erp"."ordenes_venta" ADD CONSTRAINT "ordenes_venta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "erp"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."ordenes_venta" ADD CONSTRAINT "ordenes_venta_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "erp"."tiendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."orden_venta_lineas" ADD CONSTRAINT "orden_venta_lineas_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "erp"."ordenes_venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
