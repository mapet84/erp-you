import { requireCan } from "@/lib/erp/session.server";
import { ModuloProximamente } from "../modulo-proximamente";

export default async function FinanzasPage() {
  await requireCan("FINANZAS", "read");
  return (
    <ModuloProximamente
      titulo="Finanzas"
      descripcion="Compras, gastos y estado de resultados."
    />
  );
}
