// src/components/developer/logs/types.ts
import type { LogSeverityValue, LogCategoryValue } from "@/components/developer/logs/logMeta";

// Matches the `select` in GET /api/developer/logs (list) — deliberately
// excludes stack/metadata/userAgent, which only the detail endpoint returns.
export interface LogRow {
  id: string;
  timestamp: string;
  severity: LogSeverityValue;
  category: LogCategoryValue;
  route: string | null;
  method: string | null;
  userId: string | null;
  role: string | null;
  ip: string | null;
  message: string;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

// Full row returned by GET /api/developer/logs/[id]
export interface LogDetail extends LogRow {
  userAgent: string | null;
  stack: string | null;
  metadata: Record<string, unknown> | null;
  resolvedBy: string | null;
}
