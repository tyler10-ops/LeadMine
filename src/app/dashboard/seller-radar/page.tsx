"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const TerritoryMap = dynamic(
  () => import("@/components/map/territory-map").then(m => m.TerritoryMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen w-screen flex items-center justify-center bg-[#080808]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
          <p className="text-[12px] text-neutral-600">Loading map…</p>
        </div>
      </div>
    ),
  }
);

export default function MapPage() {
  return <TerritoryMap />;
}