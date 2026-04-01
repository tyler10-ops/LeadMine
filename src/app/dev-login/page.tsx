"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Development-only auto-login page.
 * Signs in as the test user and redirects to the dashboard.
 * In production builds, this page renders nothing useful.
 */
export default function DevLoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Authenticating...");

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      setStatus("Not available in production.");
      return;
    }

    const login = async () => {
      const supabase = createClient();

      // Sign out any existing session first
      await supabase.auth.signOut();

      const { error } = await supabase.auth.signInWithPassword({
        email: "tyler10@airsist.com",
        password: "devpass123",
      });

      if (error) {
        setStatus("Login failed: " + error.message);
        return;
      }

      setStatus("Authenticated. Redirecting...");
      router.push("/dashboard");
    };

    login();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <p className="text-sm text-neutral-500 font-mono">{status}</p>
    </div>
  );
}
