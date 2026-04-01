"use client";

import { useState, useEffect } from "react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import type { Client } from "@/types";

export function useClient() {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClient = async () => {
      const supabase = createSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      setClient(data as Client);
      setLoading(false);
    };

    fetchClient();
  }, []);

  return { client, loading, error };
}
