import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PanelEditor } from "@/components/panel-editor";

export const metadata: Metadata = {
  title: "Mi diagnóstico — Creativa Balam",
};

export default async function DiagnosticoPanelPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: diagnostico } = await supabase
    .from("diagnosticos")
    .select(
      "respuestas, idioma, telefono_contacto, quiere_revision, updated_at, plan_texto, plan_generado_at, completado",
    )
    .eq("user_id", user!.id)
    .maybeSingle();

  // El panel es para un diagnóstico ya terminado -- si entran directo por
  // URL con un borrador a medias (o sin empezar), se les manda a terminarlo
  // en vez de mostrarles un panel vacío/incompleto.
  if (!diagnostico?.completado) {
    redirect("/formulario");
  }

  return (
    <PanelEditor
      userId={user!.id}
      userEmail={user!.email ?? ""}
      initial={diagnostico}
    />
  );
}
