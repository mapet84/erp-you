-- AlterTable
ALTER TABLE "emisores" ADD COLUMN     "conceptoDefault" JSONB,
ADD COLUMN     "cpExpedicion" TEXT,
ADD COLUMN     "facturamaIssuerRef" TEXT,
ADD COLUMN     "regimenFiscal" TEXT,
ADD COLUMN     "ventanaFacturacion" TEXT NOT NULL DEFAULT 'MISMO_MES';
