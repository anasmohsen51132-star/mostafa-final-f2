"use client";
// src/hooks/useMonitoring.ts
//
// Section 8 (Auto Refresh): a single shared React Query hook, reused by
// every monitoring page, so there's one polling interval for the whole
// dashboard rather than each page inventing its own. 15s matches this
// app's existing precedent for "live-ish but not excessive" polling (see
// SessionSync.tsx's own 15s recheck interval). React Query only polls
// while the query has an active subscriber and the tab is focused
// (refetchIntervalInBackground defaults to false), so navigating away
// from every developer page — or backgrounding the tab — stops the
// polling automatically.
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "./useAuth";
import type { MonitoringSnapshot } from "@/lib/monitoring/types";

const REFRESH_INTERVAL_MS = 15_000;

export function useMonitoring() {
  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ["developer-monitoring"],
    queryFn:  () => fetchWithAuth("/api/developer/monitoring"),
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const snapshot: MonitoringSnapshot | null = data?.success ? data.data : null;

  return { snapshot, isLoading, error, dataUpdatedAt };
}
