// Lógica pura de tenant (sin acceso a BD) — testeable de forma aislada.

export type Branding = {
  nombreComercial?: string;
  colorPrimario?: string;
  logoUrl?: string;
};

export type EmisorPublico = {
  slug: string;
  razonSocial: string;
  activo: boolean;
  branding: Branding;
};

/**
 * Decide si un emisor puede mostrarse en su portal público.
 * Un slug inexistente (null/undefined) o un emisor inactivo → no renderizable (404).
 */
export function isRenderableEmisor<T extends { activo: boolean }>(
  emisor: T | null | undefined,
): emisor is T {
  return !!emisor && emisor.activo === true;
}

/** Nombre a mostrar: prioriza el nombre comercial sobre la razón social. */
export function nombreParaMostrar(
  emisor: Pick<EmisorPublico, "razonSocial" | "branding">,
): string {
  return emisor.branding?.nombreComercial?.trim() || emisor.razonSocial;
}
