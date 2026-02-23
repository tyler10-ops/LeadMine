"use client";

import { useEffect } from "react";

interface PageViewTrackerProps {
  realtorId: string;
}

export function PageViewTracker({ realtorId }: PageViewTrackerProps) {
  useEffect(() => {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        realtorId,
        type: "page_view",
      }),
    }).catch(() => {
      // Silent fail — analytics shouldn't break the page
    });
  }, [realtorId]);

  return null;
}
