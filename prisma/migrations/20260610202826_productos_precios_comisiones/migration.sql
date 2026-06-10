-- CreateTable
CREATE TABLE "erp"."productos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "unidadId" TEXT NOT NULL,
    "costo" DECIMAL(14,6) NOT NULL DEFAULT 0,
    "minCompra" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."producto_precios" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "canalId" TEXT NOT NULL,
    "precio" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "producto_precios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."precio_recetas" (
    "id" TEXT NOT NULL,
    "recetaId" TEXT NOT NULL,
    "canalId" TEXT NOT NULL,
    "precio" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "precio_recetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."medios_pago" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "medios_pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."comisiones" (
    "id" TEXT NOT NULL,
    "canalId" TEXT NOT NULL,
    "medioPagoId" TEXT NOT NULL,
    "comisionPct" DECIMAL(7,4) NOT NULL,

    CONSTRAINT "comisiones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigo_key" ON "erp"."productos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "producto_precios_productoId_canalId_key" ON "erp"."producto_precios"("productoId", "canalId");

-- CreateIndex
CREATE UNIQUE INDEX "precio_recetas_recetaId_canalId_key" ON "erp"."precio_recetas"("recetaId", "canalId");

-- CreateIndex
CREATE UNIQUE INDEX "medios_pago_nombre_key" ON "erp"."medios_pago"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "comisiones_canalId_medioPagoId_key" ON "erp"."comisiones"("canalId", "medioPagoId");

-- AddForeignKey
ALTER TABLE "erp"."productos" ADD CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "erp"."categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."productos" ADD CONSTRAINT "productos_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "erp"."unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."producto_precios" ADD CONSTRAINT "producto_precios_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "erp"."productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."producto_precios" ADD CONSTRAINT "producto_precios_canalId_fkey" FOREIGN KEY ("canalId") REFERENCES "erp"."canales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."precio_recetas" ADD CONSTRAINT "precio_recetas_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES "erp"."recetas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."precio_recetas" ADD CONSTRAINT "precio_recetas_canalId_fkey" FOREIGN KEY ("canalId") REFERENCES "erp"."canales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."comisiones" ADD CONSTRAINT "comisiones_canalId_fkey" FOREIGN KEY ("canalId") REFERENCES "erp"."canales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."comisiones" ADD CONSTRAINT "comisiones_medioPagoId_fkey" FOREIGN KEY ("medioPagoId") REFERENCES "erp"."medios_pago"("id") ON DELETE CASCADE ON UPDATE CASCADE;
