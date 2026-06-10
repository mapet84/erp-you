"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCan } from "@/lib/erp/session.server";

export interface ClienteState {
  ok?: boolean;
  error?: string;
}

const schema = z.object({
  nombre: z.string().trim().min(1),
  rfc: z.string().trim().optional(),
  correos: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
  diasPago: z.string().trim().optional(),
  dirFacturacion: z.string().trim().optional(),
  dirEntrega: z.string().trim().optional(),
});

export async function crearCliente(_prev: ClienteState, formData: FormData): Promise<ClienteState> {
  await requireCan("GESTION", "configure");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "El nombre es obligatorio." };
  const d = parsed.data;
  const diasPago = d.diasPago && !Number.isNaN(Number(d.diasPago)) ? Math.trunc(Number(d.diasPago)) : null;
  const correos = (d.correos ?? "")
    .split(/[,;\s]+/)
    .map((c) => c.trim())
    .filter(Boolean);

  await prisma.cliente.create({
    data: {
      nombre: d.nombre,
      rfc: d.rfc || null,
      correos,
      telefono: d.telefono || null,
      diasPago,
      dirFacturacion: d.dirFacturacion || null,
      dirEntrega: d.dirEntrega || null,
    },
  });
  revalidatePath("/gestion/clientes");
  return { ok: true };
}
