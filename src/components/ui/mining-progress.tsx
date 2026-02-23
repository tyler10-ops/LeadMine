import { cn } from "@/lib/utils";

export type MiningPhase =
  | "intake"
  | "filtering"
  | "grading"
  | "extraction"
  | "delivered";

interface MiningProgressProps {
  phase: MiningPhase;
  className?: string;
}

const PHASES: { id: MiningPhase; label: string }[] = [
  { id: "intake",     label: "Intake" },
  { id: "filtering",  label: "Filter" },
  { id: "grading",    label: "Grade" },
  { id: "extraction", label: "Extract" },
  { id: "delivered",  label: "Deliver" },
];

const PHASE_INDEX: Record<MiningPhase, number> = {
  intake:     0,
  filtering:  1,
  grading:    2,
  extraction: 3,
  delivered:  4,
};

export function MiningProgress({ phase, className }: MiningProgressProps) {
  const currentIndex = PHASE_INDEX[phase];
  const progressPct = Math.round((currentIndex / (PHASES.length - 1)) * 100);

  return (
    <div className={cn("w-full", className)}>
      {/* Track + fill */}
      <div className="relative h-1 bg-[#1A1A1A] rounded-full overflow-hidden mb-3">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{
            width: `${progressPct}%`,
            background:
              "linear-gradient(90deg, #FF3B30 0%, #FFD60A 50%, #00FF88 100%)",
          }}
        />
      </div>

      {/* Phase labels + dots */}
      <div className="flex justify-between">
        {PHASES.map((p, i) => (
          <div key={p.id} className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors duration-500",
                i < currentIndex
                  ? "bg-[#00FF88]"
                  : i === currentIndex
                  ? "bg-[#00FF88] ring-2 ring-[#00FF88]/30"
                  : "bg-[#2A2A2A]"
              )}
            />
            <span
              className={cn(
                "text-[9px] uppercase tracking-widest hidden sm:block transition-colors duration-500",
                i === currentIndex
                  ? "text-[#00FF88]"
                  : i < currentIndex
                  ? "text-neutral-500"
                  : "text-neutral-700"
              )}
            >
              {p.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
