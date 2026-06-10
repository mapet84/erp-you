// Asignación de códigos consecutivos. Los ingredientes usan un consecutivo en el
// rango 100001–199999.

import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const ING_MIN = 100001;
const ING_MAX = 199999;

type Cliente = typeof prisma | Prisma.TransactionClient;

/// Siguiente código de ingrediente (consecutivo en [100001, 199999]).
export async function siguienteCodigoIngrediente(client: Cliente = prisma): Promise<string> {
  const ings = await client.ingrediente.findMany({ select: { codigo: true } });
  let max = ING_MIN - 1;
  for (const i of ings) {
    const n = Number(i.codigo);
    if (Number.isInteger(n) && n >= ING_MIN && n <= ING_MAX && n > max) max = n;
  }
  const next = max + 1;
  if (next > ING_MAX) throw new Error("Se agotó el rango de códigos de ingrediente (199999).");
  return String(next);
}
