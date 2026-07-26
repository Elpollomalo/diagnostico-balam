import { LandingPage } from "@/components/landing-page";

// La raíz es siempre la landing pública, sin importar si hay sesión activa
// -- entrar al formulario o al panel es una acción explícita (botón
// "Iniciar sesión" o el CTA de "Iniciar mi diagnóstico"), no algo que pase
// solo por tener una sesión abierta. Antes, tener sesión mandaba derecho al
// formulario y nunca se veía la landing de nuevo -- ver /formulario y
// /panel para la lógica de a dónde entra cada quien.
export default function DiagnosticoPage() {
  return <LandingPage />;
}
