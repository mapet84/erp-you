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
- [ ] Seed curado de `c_RegimenFiscal`, `c_UsoCFDI` y `c_FormaPago` (claves vigentes relevantes para autofactura).
- [ ] Dropdowns de Régimen, Uso CFDI y Forma de Pago alimentados desde la BD.
- [ ] Formulario completo del receptor cableado al flujo de timbrado.
- [ ] `billing-rules`: validación de formato (RFC 12 moral / 13 física, CP 5 dígitos, pertenencia a catálogo) vía Zod, ejecutada antes de llamar al PAC.
- [ ] **Tests** de `billing-rules` para validación de formato: RFC válidos/ inválidos (12 y 13), CP, clave fuera de catálogo.

## Blocked by
- #3 · [Timbrado feliz end-to-end](03-timbrado-feliz.md)
