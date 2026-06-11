import { redirect } from "next/navigation";

// La raíz lleva al ERP. El portal público de autofacturación (Fase 1) sigue
// accesible directamente en /f/[slug].
export default function Home() {
  redirect("/dashboard");
}
