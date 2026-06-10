-- CreateTable
CREATE TABLE "erp"."unidades" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."categorias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."canales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "canales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."ingredientes" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidadId" TEXT NOT NULL,
    "costoCompra" DECIMAL(14,6) NOT NULL DEFAULT 0,
    "minCompra" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."recetas" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."receta_componentes" (
    "id" TEXT NOT NULL,
    "recetaId" TEXT NOT NULL,
    "ingredienteId" TEXT NOT NULL,
    "cantidad" DECIMAL(14,4) NOT NULL,
    "rendimiento" DECIMAL(7,4) NOT NULL DEFAULT 100,

    CONSTRAINT "receta_componentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp"."margen_objetivo" (
    "id" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "canalId" TEXT NOT NULL,
    "margen" DECIMAL(7,4) NOT NULL,

    CONSTRAINT "margen_objetivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unidades_codigo_key" ON "erp"."unidades"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "erp"."categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "canales_nombre_key" ON "erp"."canales"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ingredientes_codigo_key" ON "erp"."ingredientes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "recetas_sku_key" ON "erp"."recetas"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "margen_objetivo_categoriaId_canalId_key" ON "erp"."margen_objetivo"("categoriaId", "canalId");

-- AddForeignKey
ALTER TABLE "erp"."ingredientes" ADD CONSTRAINT "ingredientes_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "erp"."unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."recetas" ADD CONSTRAINT "recetas_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "erp"."categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."receta_componentes" ADD CONSTRAINT "receta_componentes_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES "erp"."recetas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."receta_componentes" ADD CONSTRAINT "receta_componentes_ingredienteId_fkey" FOREIGN KEY ("ingredienteId") REFERENCES "erp"."ingredientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."margen_objetivo" ADD CONSTRAINT "margen_objetivo_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "erp"."categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp"."margen_objetivo" ADD CONSTRAINT "margen_objetivo_canalId_fkey" FOREIGN KEY ("canalId") REFERENCES "erp"."canales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
