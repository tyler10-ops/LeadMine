"use client";

import { ClientHub } from "./client-hub";

interface HubShellProps {
  children: React.ReactNode;
  realtorSlug?: string;
  realtorName?: string;
  realtorCity?: string;
}

export function HubShell({
  realtorSlug,
  realtorName,
  realtorCity,
}: HubShellProps) {
  return (
    <ClientHub
      realtorSlug={realtorSlug}
      realtorName={realtorName}
      realtorCity={realtorCity}
    />
  );
}
