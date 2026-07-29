import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { consumoDelMes } from "@/lib/cuotas";
import { getPlan, type PlanId } from "@/lib/planes";
import { PLANTILLAS } from "@/lib/plantillas";
import { PonexoPanel } from "@/components/ponexo-panel";

export const metadata: Metadata = {
  title: "Ponexo Manager — Creativa Balam",
};

export default async function PonexoPanelPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const [{ data: perfil }, { data: suscripcion }, { data: ejecuciones }, consumo] =
    await Promise.all([
      supabase
        .from("perfiles_negocio")
        .select("completitud, idioma")
        .eq("user_id", user!.id)
        .maybeSingle(),
      supabase
        .from("suscripciones")
        .select("plan, estado")
        .eq("user_id", user!.id)
        .maybeSingle(),
      supabase
        .from("ejecuciones")
        .select(
          "id, plantilla, titulo, estado, presupuesto_agotado, error, encolada_at, terminada_at",
        )
        .eq("user_id", user!.id)
        .order("encolada_at", { ascending: false })
        .limit(20),
      consumoDelMes(supabase, user!.id),
    ]);

  const planId: PlanId = suscripcion?.estado === "activo" ? getPlan(suscripcion.plan).id : "free";
  const plan = getPlan(planId);

  return (
    <PonexoPanel
      userEmail={user!.email ?? ""}
      plan={plan}
      perfilCompletitud={perfil?.completitud ?? 0}
      idioma={(perfil?.idioma as "es" | "en") || "es"}
      consumo={consumo}
      plantillas={PLANTILLAS}
      ejecucionesIniciales={ejecuciones ?? []}
    />
  );
}
