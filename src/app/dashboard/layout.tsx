import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HubShell } from "./hub-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: realtor } = await supabase
    .from("realtors")
    .select("slug, name, city")
    .eq("user_id", user.id)
    .single();

  return (
    <HubShell
      realtorSlug={realtor?.slug}
      realtorName={realtor?.name}
      realtorCity={realtor?.city}
    >
      {children}
    </HubShell>
  );
}
