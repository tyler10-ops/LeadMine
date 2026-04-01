import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: realtor } = await supabase
    .from("realtors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!client && !realtor) redirect("/onboarding");

  return <>{children}</>;
}
