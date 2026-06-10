# F2·3 · De ingrediente a precio sugerido

**Tipo:** AFK
**Triage:** `ready-for-agent`

## Parent
PRD: [`../PRD-fase2.md`](../PRD-fase2.md) — ERP YOU · Fase 2

## What to build
El primer hilo vertical del Módulo 1 (Gestión): el camino más delgado de **ingrediente → receta →
costo → precio sugerido**. Se introducen los catálogos mínimos necesarios inline (Unidad,
Categoría, Canal) y los modelos `Ingrediente` (con `costoCompra` general y `minCompra`), `Receta` y
`RecetaComponente`, más la configuración de **margen objetivo por (categoría, canal)**. Se crean los
módulos puros `costeo` (base de costo de compra) y `pricing`.

Comportamiento end-to-end: como CONFIGURADOR capturas un ingrediente con su **costo de compra**,
creas una receta de **un componente** (un ingrediente, con cantidad/unidad/rendimiento), y la
pantalla muestra el **costo de compra calculado** de la receta (Σ costo×cantidad÷rendimiento%) y un
**precio de venta sugerido** por canal derivado del margen objetivo: `precioSinIVA =
costoCompra/(1−margen)`, `precio = precioSinIVA × 1.16`. Arranque con datos en blanco.

Costo dual: aquí se calcula el **costo de compra (general)**. El **costo CPM por tienda** llega en
la rebanada #6 (compras). El precio siempre se deriva del costo de compra.

## Acceptance criteria
- [ ] Catálogos mínimos `Unidad`, `Categoria`, `Canal` con alta básica (se amplían en #5).
- [ ] Modelo `Ingrediente` (codigo único, nombre, unidadId, `costoCompra Decimal(14,6)`, `minCompra Decimal(14,4)`) + CRUD.
- [ ] Modelos `Receta` (sku único, nombre, categoriaId, tamanoId?) y `RecetaComponente` (ingredienteId, cantidad, unidadId, rendimiento `Decimal(7,4)` default 100, snapshots `costo`/`costoAjustado`).
- [ ] Modelo `MargenObjetivo(categoriaId, canalId, margen Decimal(7,4))` con configuración.
- [ ] Módulo puro `costeo`: `costoComponente({costoUnitario,cantidad,rendimiento})` y `costoReceta(componentes)` sobre la base de compra.
- [ ] Módulo puro `pricing`: `pvSinIva(pv,tasa=0.16)`, `margen(pvSin,costo)`, `precioDesdeMargen(costoCompra, margenObjetivo, tasa)`.
- [ ] Pantalla de receta que muestra costo de compra calculado y precio sugerido por canal.
- [ ] **Tests** de `costeo` (rendimiento 100/50, suma exacta) y `pricing` (margen 0, costo>pv, frontera, precioDesdeMargen).
- [ ] **Verificable:** capturo 1 ingrediente y 1 receta de un componente → veo costo de compra y precio sugerido correctos.

## Blocked by
- F2·2 · [Usuarios, tiendas y permisos](f2-02-usuarios-tiendas-rbac.md)
