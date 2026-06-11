import { requireCan } from "@/lib/erp/session.server";
import { ImportForm } from "./import-form";
import {
  importIngredientesAction,
  importProductosAction,
  importSemisAction,
  importRecetasAction,
} from "./actions";

export default async function ImportarPage() {
  await requireCan("GESTION", "configure");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Importación masiva (CSV)</h1>
        <p className="mt-1 text-sm text-neutral-500">
          La primera fila son los encabezados. Los códigos/SKU se asignan automáticamente. Es
          idempotente por nombre (re-importar no duplica). Recetas y semi-terminados usan formato
          “largo”: una fila por componente, agrupadas por su nombre.
        </p>
      </div>

      <ImportForm
        titulo="Ingredientes"
        formato="nombre, unidad, costo, min_compra"
        ejemplo={"nombre,unidad,costo,min_compra\nHarina,KG,20,2\nLeche,L,18,1"}
        action={importIngredientesAction}
      />

      <ImportForm
        titulo="Productos (no-receta)"
        formato="descripcion, categoria, unidad, costo"
        ejemplo={"descripcion,categoria,unidad,costo\nServilletas,Insumos,PZA,0.5"}
        action={importProductosAction}
      />

      <ImportForm
        titulo="Semi-terminados"
        formato="semiterminado, tipo (ingrediente|semiterminado), componente, cantidad, rendimiento"
        ejemplo={"semiterminado,tipo,componente,cantidad,rendimiento\nMasa base,ingrediente,Harina,0.5,100\nMasa base,ingrediente,Huevo,2,100"}
        action={importSemisAction}
      />

      <ImportForm
        titulo="Recetas"
        formato="receta, categoria, tamano, tipo (ingrediente|semiterminado), componente, cantidad, rendimiento"
        ejemplo={"receta,categoria,tamano,tipo,componente,cantidad,rendimiento\nPan blanco,Panadería,Individual,semiterminado,Masa base,2,100\nPan blanco,Panadería,Individual,ingrediente,Sal,0.01,100"}
        action={importRecetasAction}
      />
    </div>
  );
}
