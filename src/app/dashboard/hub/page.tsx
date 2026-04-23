import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HubShell } from "@/app/dashboard/hub-shell";
import type { Plan } from "@/lib/plan-limits";

export default async function HubPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id, business_name, industry, plan")
    .eq("user_id", user.id)
    .single();

  const { data: realtor } = await supabase
    .from("realtors")
    .select("id, name, plan")
    .eq("user_id", user.id)
    .single();

  if (!client && !realtor) redirect("/onboarding");

  return (
    <Suspense>
      <HubShell
        clientId={client?.id ?? realtor?.id}
        businessName={client?.business_name ?? realtor?.name ?? "LeadMine"}
        industry={client?.industry ?? "real_estate"}
        plan={(client?.plan ?? realtor?.plan ?? "free") as Plan}
      />
    </Suspense>
  );
}
