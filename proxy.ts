// Proxy (Next.js 16; antes "middleware"). Gate ligero del ERP: si no hay cookie
// de sesión, redirige a /login. La autorización real (sesión válida + permisos
// por módulo/tienda) se verifica en cada página y server action (runtime Node),
// nunca solo aquí — ver la guía de Data Security de Next.js.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Nombres de la cookie de sesión JWT de Auth.js v5 (http en dev, __Secure- en https).
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function proxy(request: NextRequest) {
  const haySesion = SESSION_COOKIES.some((c) => request.cookies.has(c));
  if (haySesion) return NextResponse.next();

  const url = new URL("/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

// Solo las rutas del ERP. /login, / (portal F1), /f/*, /factura/* y /api/auth
// quedan fuera del matcher a propósito.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/gestion/:path*",
    "/pos/:path*",
    "/finanzas/:path*",
    "/pronosticos/:path*",
    "/admin/:path*",
    "/configuracion/:path*",
  ],
};
