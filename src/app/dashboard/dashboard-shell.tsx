"use client";

import { Sidebar } from "@/components/dashboard/sidebar";

interface DashboardShellProps {
  children: React.ReactNode;
  businessName?: string;
}

export function DashboardShell({
  children,
  businessName,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-neutral-950">
      <Sidebar businessName={businessName} />
      <main className="flex-1 p-8">
        {businessName && (
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
              Welcome back, {businessName}
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Here&apos;s your mining overview
            </p>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
