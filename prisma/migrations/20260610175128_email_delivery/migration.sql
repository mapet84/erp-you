-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "correoEnviado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "correoError" TEXT;
