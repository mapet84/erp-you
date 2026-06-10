-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "emisorId" TEXT NOT NULL,
    "folioTicket" TEXT NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "iva" DECIMAL(12,2) NOT NULL,
    "receptorRfc" TEXT NOT NULL,
    "receptorNombre" TEXT NOT NULL,
    "receptorCp" TEXT NOT NULL,
    "receptorRegimen" TEXT NOT NULL,
    "usoCfdi" TEXT NOT NULL,
    "formaPago" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "estatus" TEXT NOT NULL DEFAULT 'timbrada',
    "uuid" TEXT,
    "facturamaCfdiId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_uuid_key" ON "invoices"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_emisorId_folioTicket_key" ON "invoices"("emisorId", "folioTicket");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_emisorId_fkey" FOREIGN KEY ("emisorId") REFERENCES "emisores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
