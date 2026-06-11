-- AlterTable
ALTER TABLE "erp"."canales" ADD COLUMN     "medioPagoPrincipalId" TEXT;

-- CreateTable
CREATE TABLE "erp"."conversiones_unidad" (
    "id" TEXT NOT NULL,
    "origenId" TEXT NOT NULL,
    "destinoId" TEXT NOT NULL,
    "factor" DECIMAL(18,8) NOT NULL,

    CONSTRAINT "conversiones_unidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."motivos_ajuste" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "motivos_ajuste_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversiones_unidad_origenId_destinoId_key" ON "erp"."conversiones_unidad"("origenId", "destinoId");

-- CreateIndex
CREATE UNIQUE INDEX "motivos_ajuste_nombre_key" ON "erp"."motivos_ajuste"("nombre");

-- AddForeignKey
ALTER TABLE "erp"."conversiones_unidad" ADD CONSTRAINT "conversiones_unidad_origenId_fkey" FOREIGN KEY ("origenId") REFERENCES "erp"."unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."conversiones_unidad" ADD CONSTRAINT "conversiones_unidad_destinoId_fkey" FOREIGN KEY ("destinoId") REFERENCES "erp"."unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."canales" ADD CONSTRAINT "canales_medioPagoPrincipalId_fkey" FOREIGN KEY ("medioPagoPrincipalId") REFERENCES "erp"."medios_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;
