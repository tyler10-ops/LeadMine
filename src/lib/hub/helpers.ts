import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Get authenticated realtor ID from session.
 * Returns null if not authenticated or no realtor profile exists.
 */
export async function getAuthenticatedRealtorId(): Promise<string | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: realtor } = await supabase
    .from("realtors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return realtor?.id || null;
}
