# F2·4 · Recetas completas (semi-terminados, rendimiento, ciclos)

**Tipo:** AFK
**Triage:** `ready-for-agent`

## Parent
PRD: [`../PRD-fase2.md`](../PRD-fase2.md) — ERP YOU · Fase 2

## What to build
Engrosar el costeo del Módulo 1 con recetas reales: múltiples componentes, **semi-terminados
componibles y anidados**, y rendimiento por componente. Se agregan `SemiTerminado` y
`SemiTerminadoComponente` (mismo shape que receta; un componente puede ser un ingrediente o un
semi-terminado hijo → recursivo), y se amplía el módulo `costeo` con explosión recursiva a
ingredientes hoja y **detección de ciclos**. Se añade el catálogo `Tamano`.

Comportamiento end-to-end: como CONFIGURADOR armas una receta con varios componentes, defines un
semi-terminado (p. ej. "masa base") y lo usas dentro de una receta (incluso un semi dentro de otro
semi), y el **costo de compra calculado** baja correctamente hasta los ingredientes hoja. Si creas
un semi-terminado que se referencia a sí mismo (directa o indirectamente), el sistema lo **rechaza**
con un error claro en lugar de colgarse.

## Acceptance criteria
- [ ] Modelos `SemiTerminado` y `SemiTerminadoComponente` (componente = ingredienteId XOR semiTerminadoHijoId), con cantidad/unidad/rendimiento.
- [ ] `RecetaComponente` admite ingrediente **o** semi-terminado como componente.
- [ ] Catálogo `Tamano` y su uso en recetas.
- [ ] `costeo.explotarSemiTerminado(semi, resolver)` recursivo a ingredientes hoja con **detección de ciclos** (lanza error).
- [ ] `costeo.costearReceta(receta, resolver)` devuelve total y detalle por componente (compra) considerando rendimiento en cada nivel.
- [ ] UI de alta/edición de recetas y semi-terminados con selección de componentes.
- [ ] **Tests** de `costeo`: semi anidado (≥2 niveles), ciclo (throw), suma exacta con rendimientos mixtos.
- [ ] **Verificable:** una receta con semi-terminado anidado da el costo correcto; un ciclo se rechaza.

## Blocked by
- F2·3 · [De ingrediente a precio sugerido](f2-03-ingrediente-a-precio.md)
