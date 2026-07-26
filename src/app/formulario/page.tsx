import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DiagnosticoWizard } from "@/components/diagnostico-wizard";
import type { Lang } from "@/lib/config";

// Punto de entrada real al formulario -- la landing ("/") ya no lo hace
// directamente. Reglas (pedidas por Carlos):
// - Sin sesión -> a la landing (ahí se registra o inicia sesión).
// - Con sesión y diagnóstico ya completado -> directo al panel, no se
//   vuelve a llenar el formulario desde cero.
// - Con sesión y diagnóstico a medias (o inexistente) -> el formulario,
//   retomando las respuestas ya guardadas si las hay.
export default async function FormularioPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: diagnostico } = await supabase
    .from("diagnosticos")
    .select("respuestas, idioma, completado")
    .eq("user_id", user.id)
    .maybeSingle();

  if (diagnostico?.completado) {
    redirect("/panel");
  }

  return (
    <DiagnosticoWizard
      userId={user.id}
      userEmail={user.email ?? ""}
      initialAnswers={(diagnostico?.respuestas as Record<string, unknown>) ?? null}
      initialLang={(diagnostico?.idioma as Lang) ?? null}
    />
  );
}
