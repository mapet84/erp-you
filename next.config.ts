import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Habilita forbidden()/unauthorized() para 403/401 en el ERP (RBAC).
    authInterrupts: true,
  },
};

export default nextConfig;
