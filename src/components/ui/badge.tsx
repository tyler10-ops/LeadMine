import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "buyer" | "seller" | "investor" | "unknown" | "default";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-brand-50 text-brand-600": variant === "buyer",
          "bg-aqua-50 text-teal-500": variant === "seller",
          "bg-purple-50 text-purple-700": variant === "investor",
          "bg-neutral-100 text-neutral-600": variant === "unknown" || variant === "default",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
