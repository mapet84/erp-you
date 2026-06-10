# 6 · Catálogos + formulario fiscal completo

**Tipo:** AFK

## Parent
PRD: [`../PRD.md`](../PRD.md) — ERP YOU · Fase 1: Portal de Autofacturación CFDI 4.0

## What to build
El formulario fiscal completo del receptor con catálogos del SAT y validación de formato. Se
siembra en la BD un subconjunto curado y vigente de `c_RegimenFiscal`, `c_UsoCFDI` y
`c_FormaPago`, y el formulario los expone como dropdowns. El módulo puro `billing-rules` valida
formato (RFC 12/13 según persona moral/física, CP de 5 dígitos, pertenencia a catálogo de las
claves elegidas) antes de llamar al PAC.

Reemplaza el formulario mínimo del slice #3 por la captura completa: RFC, Nombre, CP, Régimen
Fiscal, Uso CFDI, Forma de Pago y correo.

## Acceptance criteria
- [x] Seed curado de `c_RegimenFiscal`, `c_UsoCFDI` y `c_FormaPago` (claves vigentes relevantes para autofactura). *(modelo `CatalogoSat`, 15 claves sembradas desde `catalogs.ts`.)*
- [x] Dropdowns de Régimen, Uso CFDI y Forma de Pago alimentados desde la BD. *(`catalogs.server.ts` → `loadCatalogos`.)*
- [x] Formulario completo del receptor cableado al flujo de timbrado.
- [x] `billing-rules`: validación de formato (RFC 12 moral / 13 física, CP 5 dígitos, pertenencia a catálogo) vía Zod, ejecutada antes de llamar al PAC. *(src/lib/billing-rules.ts: `receptorSchema`, `esRfcValido`, `esCpValido`, `perteneceACatalogo`.)*
- [x] **Tests** de `billing-rules` para validación de formato: RFC válidos/ inválidos (12 y 13), CP, clave fuera de catálogo.

> Avance autónomo 2026-06-10: el módulo puro `billing-rules` (validación de formato) y sus tests
> están hechos. Falta lo dependiente de #3/UI: seed curado de catálogos, dropdowns desde BD y el
> formulario completo cableado al timbrado.

## Blocked by
- #3 · [Timbrado feliz end-to-end](03-timbrado-feliz.md)
