import { requireCan } from "@/lib/erp/session.server";
import { ModuloProximamente } from "../modulo-proximamente";

export default async function PosPage() {
  await requireCan("POS", "read");
  return (
    <ModuloProximamente titulo="Punto de Venta" descripcion="Ventas, ticket e inventario." />
  );
}
