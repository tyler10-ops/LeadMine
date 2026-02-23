"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-brand-500 text-white hover:bg-brand-400":
              variant === "primary",
            "bg-brand-50 text-brand-600 hover:bg-brand-100":
              variant === "secondary",
            "bg-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100":
              variant === "ghost",
            "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50":
              variant === "outline",
            "text-sm px-3 py-1.5 rounded-md": size === "sm",
            "text-sm px-4 py-2 rounded-lg": size === "md",
            "text-base px-6 py-3 rounded-lg": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
