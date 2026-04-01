"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Pickaxe, X } from "lucide-react";
import { ClientHub } from "./client-hub";
import type { Plan } from "@/lib/plan-limits";

interface HubShellProps {
  clientId?: string;
  businessName?: string;
  industry?: string;
  plan?: Plan;
}

export function HubShell({
  clientId,
  businessName,
  industry,
  plan,
}: HubShellProps) {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (searchParams.get("mined") === "1") {
      setShowBanner(true);
      // Clean the param from the URL without triggering a re-render
      router.replace("/dashboard/hub", { scroll: false });
    }
  }, [searchParams, router]);

  return (
    <>
      {showBanner && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg max-w-md w-full mx-4"
          style={{
            background: "rgba(0,20,12,0.95)",
            border: "1px solid rgba(0,255,136,0.3)",
            boxShadow: "0 0 24px rgba(0,255,136,0.12)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(0,255,136,0.15)" }}
          >
            <Pickaxe className="w-3.5 h-3.5" style={{ color: "#00FF88" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-neutral-100">
              Mining your first leads now
            </p>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Your county data is being pulled and graded. Elite gems will appear in your pipeline within minutes.
            </p>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="shrink-0 opacity-40 hover:opacity-80 transition-opacity"
          >
            <X className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        </div>
      )}
      <ClientHub
        clientId={clientId}
        businessName={businessName}
        industry={industry}
        plan={plan}
      />
    </>
  );
}
