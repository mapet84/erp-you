-- CreateTable
CREATE TABLE "erp"."pronostico_gastos" (
    "id" TEXT NOT NULL,
    "pronosticoId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "periodicidad" "erp"."Periodicidad" NOT NULL,
    "ocurrencias" INTEGER NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "pronostico_gastos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "erp"."pronostico_gastos" ADD CONSTRAINT "pronostico_gastos_pronosticoId_fkey" FOREIGN KEY ("pronosticoId") REFERENCES "erp"."pronosticos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
