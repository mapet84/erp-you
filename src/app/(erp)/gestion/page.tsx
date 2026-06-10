import { requireCan } from "@/lib/erp/session.server";
import { ModuloProximamente } from "../modulo-proximamente";

export default async function GestionPage() {
  await requireCan("GESTION", "read");
  return (
    <ModuloProximamente
      titulo="Gestión"
      descripcion="Ingredientes, recetas, costeo y precios."
    />
  );
}
