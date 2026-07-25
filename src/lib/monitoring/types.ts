// src/lib/monitoring/types.ts
//
// Shared shapes for Task 3 (Live Monitoring & Platform Health). One place
// so src/app/api/developer/monitoring/route.ts and every dashboard page
// that consumes it stay in sync, mirroring the pattern already used for
// LogRow in src/components/developer/logs/types.ts.

export type HealthStatus = "HEALTHY" | "WARNING" | "CRITICAL";

export interface SystemHealth {
  score: number; // 0–100
  status: HealthStatus;
  // Short, human-readable reasons the score isn't 100 — empty when healthy.
  reasons: string[];
}

export interface ApiMetrics {
  // Derived from RequestMetric — see the doc comment on that model in
  // schema.prisma for why this only reflects instrumented routes.
  avgResponseMs: number | null;
  requestsLastMinute: number;
  requestsLastHour: number;
  successRatePct: number | null; // null when there's no data yet
  failedRequests: number; // non-2xx/3xx in the last 24h, from RequestMetric
  slowestEndpoints: { route: string; avgMs: number; count: number }[];
  sampleSize: number; // total RequestMetric rows in the last 24h — lets the
  // UI show "not enough data yet" instead of a misleading stat computed
  // from 1–2 samples.
}

export interface DatabaseMetrics {
  connected: boolean;
  latencyMs: number | null;
  failedQueriesToday: number; // from SystemLog, category=DATABASE
  connectionPoolConfigured: boolean; // whether DATABASE_URL looks pooled
}

export interface StorageMetrics {
  configured: boolean; // BLOB_READ_WRITE_TOKEN present
  failedUploadsToday: number; // from SystemLog, category=UPLOAD
  status: HealthStatus;
}

export interface AuthMetrics {
  successfulLoginsToday: number;
  failedLoginsToday: number;
  unauthorizedRequestsToday: number;
  expiredSessionsToday: number;
}

export interface PlatformMetrics {
  activeUsersLast15Min: number;
  onlineAdminsLast15Min: number;
  onlineOwnersLast15Min: number;
  currentSessions: number; // users with a currentSessionId set
  requestsToday: number; // RequestMetric rows today (instrumented routes only)
  errorsToday: number;
  warningsToday: number;
  criticalEventsToday: number;
}

export interface MonitoringSnapshot {
  generatedAt: string; // ISO timestamp, for the UI to show "as of ..."
  health: SystemHealth;
  api: ApiMetrics;
  database: DatabaseMetrics;
  storage: StorageMetrics;
  auth: AuthMetrics;
  platform: PlatformMetrics;
}
