// src/lib/ai-guardian/monitoring/unavailableMetrics.ts
//
// Placeholder implementation of the Task-3-owned sources. Returns `null`
// for every section rather than fabricating numbers — the AI prompt and
// every dashboard page treat `null` here as a normal "not collected yet"
// state (see contracts.ts for the integration note).
//
// TO INTEGRATE TASK 3: create a module implementing
// PerformanceMetricsSource / DatabaseMetricsSource / StorageMetricsSource
// from ./contracts.ts against Task 3's real tables/services, then swap the
// import in snapshot.ts from this file to that one. Nothing else in the
// AI Guardian needs to change.
import type {
  PerformanceMetricsSource, DatabaseMetricsSource, StorageMetricsSource,
} from "@/lib/ai-guardian/monitoring/contracts";

export const unavailableMetrics: PerformanceMetricsSource & DatabaseMetricsSource & StorageMetricsSource = {
  async getPerformanceSummary() {
    return null;
  },
  async getDatabaseSummary() {
    return null;
  },
  async getStorageSummary() {
    return null;
  },
};
