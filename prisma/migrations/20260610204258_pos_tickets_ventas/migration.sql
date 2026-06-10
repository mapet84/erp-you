-- CreateEnum
CREATE TYPE "erp"."TipoVenta" AS ENUM ('VENTA', 'DEVOLUCION');

-- CreateTable
CREATE TABLE "erp"."tickets_pos" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "canalId" TEXT NOT NULL,
    "medioPagoId" TEXT,
    "tipo" "erp"."TipoVenta" NOT NULL DEFAULT 'VENTA',
    "total" DECIMAL(14,2) NOT NULL,
    "subtotalSinIva" DECIMAL(14,2) NOT NULL,
    "iva" DECIMAL(14,2) NOT NULL,
    "comisionMonto" DECIMAL(14,2) NOT NULL,
    "costo" DECIMAL(14,2) NOT NULL,
    "utilidad" DECIMAL(14,2) NOT NULL,
    "folioTicket" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."ventas" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "erp"."TipoVenta" NOT NULL DEFAULT 'VENTA',
    "usuarioId" TEXT NOT NULL,
    "canalId" TEXT NOT NULL,
    "medioPagoId" TEXT,
    "codigo" TEXT NOT NULL,
    "articulo" TEXT NOT NULL,
    "qty" DECIMAL(14,4) NOT NULL,
    "precioUnit" DECIMAL(14,2) NOT NULL,
    "totalVenta" DECIMAL(14,2) NOT NULL,
    "subtotalSinIva" DECIMAL(14,2) NOT NULL,
    "iva" DECIMAL(14,2) NOT NULL,
    "comisionPct" DECIMAL(7,4) NOT NULL,
    "comisionMonto" DECIMAL(14,2) NOT NULL,
    "cpm" DECIMAL(14,6) NOT NULL,
    "costo" DECIMAL(14,2) NOT NULL,
    "utilidadMonto" DECIMAL(14,2) NOT NULL,
    "utilidadPct" DECIMAL(7,4) NOT NULL,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tickets_pos_folio_key" ON "erp"."tickets_pos"("folio");

-- CreateIndex
CREATE INDEX "tickets_pos_tiendaId_fecha_idx" ON "erp"."tickets_pos"("tiendaId", "fecha");

-- CreateIndex
CREATE INDEX "ventas_tiendaId_fecha_idx" ON "erp"."ventas"("tiendaId", "fecha");

-- AddForeignKey
ALTER TABLE "erp"."tickets_pos" ADD CONSTRAINT "tickets_pos_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "erp"."tiendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."ventas" ADD CONSTRAINT "ventas_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "erp"."tickets_pos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."ventas" ADD CONSTRAINT "ventas_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "erp"."tiendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
