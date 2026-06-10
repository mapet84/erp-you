# F2·9 · Gastos y estado de resultados

**Tipo:** AFK
**Triage:** `ready-for-agent`

## Parent
PRD: [`../PRD-fase2.md`](../PRD-fase2.md) — ERP YOU · Fase 2

## What to build
El Módulo 2 (Finanzas): captura de gastos y el **estado de resultados**. Se agregan `CategoriaGasto`
(con `tipoER`, IVA% e ISR%) y `Gasto`, y el módulo puro `estado-resultados` que ensambla el P&L
desde filas planas. El costo de ventas proviene del **CPM por tienda** ya registrado en cada
`Venta` del POS.

Comportamiento end-to-end: como OPERATIVO capturas gastos por categoría (renta, nómina y otros) con
monto, IVA e ISR (auto-calculados según la categoría), y opcionalmente **repartes** un gasto central
entre tiendas (por ventas, por utilidad o manual). Como LECTOR ves el **estado de resultados** del
periodo (mes, rango o tienda): ingresos netos, costo de ventas, comisiones, utilidad bruta, gastos
operativos por tipo, EBIT, otros ingresos/gastos, UAI, impuestos y utilidad neta.

> ⚠️ Validar con contabilidad real las reglas precisas de **IVA acreditable** e **ISR** y documentar
> qué montos son calculados vs. informativos antes de cerrar la rebanada.

## Acceptance criteria
- [ ] Modelo `CategoriaGasto` (nombre, `tipoER` enum, cuenta?, ivaPct default 16, isrPct default 0) y `Gasto` (fecha, categoriaGastoId, descripcion, monto, iva, isr, tiendaId?, periodicidad, reparto Json?).
- [ ] Enum `TipoER{GASTO_OPERATIVO_ADMIN, GASTO_OPERATIVO_VENTAS, OTRO_GASTO, OTRO_INGRESO, GASTO_FINANCIERO, INGRESO_FINANCIERO, IMPUESTO}`.
- [ ] Auto-cálculo de IVA/ISR del gasto desde la categoría; reparto entre tiendas por ventas/utilidad/manual con validación de que la suma cuadre.
- [ ] Módulo puro `estado-resultados.construirEstadoResultados(...)` que arma el P&L por `TipoER` desde filas planas pre-filtradas.
- [ ] El costo de ventas usa `Venta.costo` (CPM por tienda al momento de la venta) y las comisiones `Venta.comisionMonto`.
- [ ] Vista de estado de resultados con filtro mensual / por rango / por tienda y márgenes (%).
- [ ] **Tests** de `estado-resultados`: mapeo por `TipoER`, signo de `OTRO_INGRESO`, rango vacío.
- [ ] **Verificable:** capturo gastos (renta/nómina) y veo un estado de resultados del mes que jala el costo de ventas del POS y los gastos por tipo.

## Blocked by
- F2·7 · [POS: vender, ticket y descuento de inventario](f2-07-pos-venta-ticket.md)
