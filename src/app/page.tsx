import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing-page";
import { DiagnosticoWizard } from "@/components/diagnostico-wizard";

export default async function DiagnosticoPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LandingPage />;
  }

  return <DiagnosticoWizard userId={user.id} userEmail={user.email ?? ""} />;
}
