import { z } from "zod";
import { FacturamaClient } from "./client";

// Credenciales de Facturama desde variables de entorno (nunca en código).
const envSchema = z.object({
  FACTURAMA_USER: z.string().min(1, "Falta FACTURAMA_USER"),
  FACTURAMA_PASSWORD: z.string().min(1, "Falta FACTURAMA_PASSWORD"),
  FACTURAMA_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
});

/** Construye un FacturamaClient leyendo las credenciales del entorno. */
export function facturamaClientFromEnv(
  source: NodeJS.ProcessEnv = process.env,
): FacturamaClient {
  const env = envSchema.parse(source);
  return new FacturamaClient({
    user: env.FACTURAMA_USER,
    password: env.FACTURAMA_PASSWORD,
    env: env.FACTURAMA_ENV,
  });
}
