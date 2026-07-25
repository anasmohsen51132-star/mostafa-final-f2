// src/lib/ai-guardian/monitoring/snapshot.ts
//
// Combines every monitoring source into one PlatformSnapshot. This is the
// ONLY place that needs to change to wire in Task 3 — swap the
// `unavailableMetrics` import below for a real implementation of
// PerformanceMetricsSource/DatabaseMetricsSource/StorageMetricsSource.
import { systemLogSource } from "@/lib/ai-guardian/monitoring/systemLogSource";
import { unavailableMetrics } from "@/lib/ai-guardian/monitoring/unavailableMetrics";
import type { PlatformSnapshot } from "@/lib/ai-guardian/monitoring/contracts";

const errorSource = systemLogSource;
const authSource = systemLogSource;
const securitySource = systemLogSource;
const eventsSource = systemLogSource;

// ← swap this for the real Task 3 source once it lands
const metricsSource = unavailableMetrics;

export async function getPlatformSnapshot(windowHours = 24): Promise<PlatformSnapshot> {
  const [errors, auth, security, systemEvents, performance, database, storage] = await Promise.all([
    errorSource.getErrorSummary(windowHours),
    authSource.getAuthSummary(windowHours),
    securitySource.getSecuritySummary(windowHours),
    eventsSource.getSystemEvents(windowHours),
    metricsSource.getPerformanceSummary(windowHours),
    metricsSource.getDatabaseSummary(windowHours),
    metricsSource.getStorageSummary(windowHours),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    windowHours,
    errors,
    auth,
    security,
    systemEvents,
    performance,
    database,
    storage,
  };
}
