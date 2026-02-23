"use client";

import { Sidebar } from "@/components/dashboard/sidebar";

interface DashboardShellProps {
  children: React.ReactNode;
  realtorSlug?: string;
  realtorName?: string;
}

export function DashboardShell({
  children,
  realtorSlug,
  realtorName,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar realtorSlug={realtorSlug} />
      <main className="flex-1 p-8">
        {realtorName && (
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Welcome back, {realtorName.split(" ")[0]}
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Here&apos;s your growth overview
            </p>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
