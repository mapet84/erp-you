-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "errorPac" TEXT,
ADD COLUMN     "fechaTicket" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "invoice_files" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "contenido" BYTEA NOT NULL,
    "contentType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogos_sat" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "catalogos_sat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoice_files_invoiceId_tipo_key" ON "invoice_files"("invoiceId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "catalogos_sat_tipo_clave_key" ON "catalogos_sat"("tipo", "clave");

-- AddForeignKey
ALTER TABLE "invoice_files" ADD CONSTRAINT "invoice_files_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
