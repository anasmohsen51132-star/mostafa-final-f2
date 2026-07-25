// src/lib/ai-guardian/monitoring/contracts.ts
//
// ── INTEGRATION CONTRACT WITH TASK 3 (Live Monitoring & Platform Health) ──
//
// This file defines the ONLY shape the AI Guardian depends on from the
// monitoring layer. Task 3 is being built independently — this codebase
// does not implement, modify, or assume anything about how that data is
// collected. It only declares the interface it needs.
//
// Today, `getPlatformSnapshot()` (see snapshot.ts) is satisfied by:
//   - systemLogSource.ts    → real data, reading Task 2's existing SystemLog
//                             table (errors, auth events, security events,
//                             system events — already shipped, safe to use)
//   - unavailableMetrics.ts → a null-object placeholder for the sections
//                             that depend on Task 3 (performance, database,
//                             storage), so the AI pipeline and every page
//                             built on it already handles "not collected
//                             yet" as a normal, first-class state rather
//                             than crashing or guessing.
//
// Once Task 3 ships, wiring it in is a ONE-LINE change in snapshot.ts:
// swap `unavailableMetrics` for a new module that implements
// `PerformanceMetricsSource` / `DatabaseMetricsSource` / `StorageMetricsSource`
// below by reading Task 3's actual tables/services. Nothing in
// promptBuilder.ts, the providers, the API routes, or any dashboard page
// needs to change — they only ever see the `PlatformSnapshot` shape.

export type HealthState = "HEALTHY" | "WARNING" | "CRITICAL" | "UNKNOWN";

// ---- Sections backed by Task 2 (SystemLog) — real today ----------------

export interface ErrorSummary {
  windowHours: number;
  totalErrors: number;
  totalCritical: number;
  totalWarnings: number;
  unresolvedCount: number;
  // Same message grouped + counted — this is the "repeated exceptions"
  // signal the AI needs, pre-aggregated so raw rows never leave the server.
  topRecurring: { message: string; category: string; count: number }[];
  byCategory: Record<string, number>;
}

export interface AuthSummary {
  windowHours: number;
  successfulLogins: number;
  failedLogins: number;
  blockedAccountAttempts: number;
  rateLimitHits: number;
}

export interface SecuritySummary {
  windowHours: number;
  securityEventCount: number;
  topEvents: { message: string; count: number }[];
}

export interface SystemEventSummary {
  windowHours: number;
  recentEvents: { message: string; category: string; severity: string; at: string }[];
}

// ---- Sections owned by Task 3 — contract only, not implemented here ----
//
// Every field is optional / the whole section can be `null`. Consumers
// (promptBuilder, dashboard pages) MUST treat "not present" as a normal
// state ("not collected yet"), not an error.

export interface PerformanceMetricsSummary {
  windowHours: number;
  avgResponseMs: number;
  requestsPerMinute: number;
  successRatePct: number;
  slowestEndpoints: { route: string; avgMs: number }[];
}

export interface DatabaseMetricsSummary {
  connectionStatus: HealthState;
  latencyMs: number | null;
  uptimePct: number | null;
  failedQueries: number;
}

export interface StorageMetricsSummary {
  available: boolean;
  usageBytes: number | null;
  fileCount: number | null;
  failedUploads: number;
}

// ---- The aggregate snapshot the AI Analysis Layer consumes -------------

export interface PlatformSnapshot {
  generatedAt: string;
  windowHours: number;

  errors: ErrorSummary;
  auth: AuthSummary;
  security: SecuritySummary;
  systemEvents: SystemEventSummary;

  // null = "this monitoring layer isn't available yet" (Task 3 pending),
  // never fabricated.
  performance: PerformanceMetricsSummary | null;
  database: DatabaseMetricsSummary | null;
  storage: StorageMetricsSummary | null;
}

// ---- Source interfaces (one per concern, so Task 3 can implement just
// the ones it owns without touching the Task-2-backed ones) -------------

export interface ErrorMetricsSource {
  getErrorSummary(windowHours: number): Promise<ErrorSummary>;
}
export interface AuthMetricsSource {
  getAuthSummary(windowHours: number): Promise<AuthSummary>;
}
export interface SecurityMetricsSource {
  getSecuritySummary(windowHours: number): Promise<SecuritySummary>;
}
export interface SystemEventsSource {
  getSystemEvents(windowHours: number): Promise<SystemEventSummary>;
}
export interface PerformanceMetricsSource {
  getPerformanceSummary(windowHours: number): Promise<PerformanceMetricsSummary | null>;
}
export interface DatabaseMetricsSource {
  getDatabaseSummary(windowHours: number): Promise<DatabaseMetricsSummary | null>;
}
export interface StorageMetricsSource {
  getStorageSummary(windowHours: number): Promise<StorageMetricsSummary | null>;
}
