// src/lib/monitoring/dbMetrics.ts
//
// Section 3 (Database Monitor). "Connected"/"latency" come from actually
// timing a real, cheap query against the live database — not a mocked
// status. "Connection pool status" is approximated from DATABASE_URL's
// shape (see PERF-comment in src/lib/prisma.ts, which already checks this
// same thing at startup) rather than a live pool-internals query, since
// Prisma doesn't expose live pool occupancy through its public client API
// without a raw, driver-specific query this app doesn't otherwise need.
import prisma from "@/lib/prisma";
import { logError } from "@/lib/logger";
import type { DatabaseMetrics } from "./types";

export async function getDatabaseMetrics(): Promise<DatabaseMetrics> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let connected = true;
  let latencyMs: number | null = null;

  const start = Date.now();
  try {
    // Cheapest real round-trip available: the singleton SiteSettings row
    // this app already reads on every page load (src/lib/site-settings.ts)
    // — no new query shape introduced, just timed here.
    await prisma.siteSettings.findUnique({ where: { id: "singleton" }, select: { id: true } });
    latencyMs = Date.now() - start;
  } catch (e) {
    connected = false;
    await logError("DATABASE", "فحص الاتصال بقاعدة البيانات فشل", {
      stack: e instanceof Error ? e.stack : null,
    });
  }

  const failedQueriesToday = await prisma.systemLog
    .count({ where: { category: "DATABASE", createdAt: { gte: startOfDay } } })
    .catch(() => 0); // if the DB itself is down, this count will also fail — fail to 0, not a crash

  const dbUrl = process.env.DATABASE_URL || "";
  const connectionPoolConfigured = dbUrl.includes("pgbouncer=true") || dbUrl.includes("-pooler.");

  return { connected, latencyMs, failedQueriesToday, connectionPoolConfigured };
}
