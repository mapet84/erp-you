import { requireCan } from "@/lib/erp/session.server";
import { ModuloProximamente } from "../modulo-proximamente";

export default async function PronosticosPage() {
  await requireCan("PRONOSTICOS", "read");
  return (
    <ModuloProximamente
      titulo="Pronósticos"
      descripcion="Pronóstico de ventas y compras."
    />
  );
}
