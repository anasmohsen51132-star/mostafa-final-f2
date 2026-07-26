// src/lib/incidents/syncIncidents.ts
//
// Groups recent ERROR/CRITICAL/WARNING SystemLog rows by fingerprint and
// upserts one Incident per recurring group. Runs opportunistically from
// GET /api/developer/incidents (see that route) — there is no cron job.
// Idempotent: counts are recomputed fresh from SystemLog every run rather
// than incremented, so repeated calls can never double-count.
import prisma from "@/lib/prisma";
import type { IncidentSeverity } from "@prisma/client";
import { buildFingerprint } from "@/lib/incidents/fingerprint";

const SYNC_WINDOW_DAYS = 30;
const MIN_OCCURRENCES = 2; // one-off errors stay in the Error Center only
const MIN_RESYNC_INTERVAL_MS = 60_000; // soft debounce, see below

function mapSeverity(logSeverity: string): IncidentSeverity {
  if (logSeverity === "CRITICAL") return "CRITICAL";
  if (logSeverity === "ERROR") return "HIGH";
  if (logSeverity === "WARNING") return "MEDIUM";
  return "LOW";
}

function severityRank(s: string): number {
  return s === "CRITICAL" ? 3 : s === "ERROR" ? 2 : s === "WARNING" ? 1 : 0;
}

interface Group {
  category: string;
  severity: string;
  title: string;
  count: number;
  first: Date;
  last: Date;
}

// Best-effort, per-instance debounce — not correctness-critical (worst
// case on a cold start is one extra sync pass), just avoids re-scanning
// 30 days of logs on every single request within the same warm instance.
let lastSyncAt = 0;

export async function syncIncidentsFromLogs(force = false): Promise<void> {
  if (!force && Date.now() - lastSyncAt < MIN_RESYNC_INTERVAL_MS) return;
  lastSyncAt = Date.now();

  const since = new Date(Date.now() - SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const logs = await prisma.systemLog.findMany({
    where: { createdAt: { gte: since }, severity: { in: ["ERROR", "CRITICAL", "WARNING"] } },
    select: { message: true, category: true, severity: true, createdAt: true },
  });
  if (logs.length === 0) return;

  const groups = new Map<string, Group>();
  for (const log of logs) {
    const fp = buildFingerprint(log.category, log.message);
    const existing = groups.get(fp);
    if (!existing) {
      groups.set(fp, { category: log.category, severity: log.severity, title: log.message, count: 1, first: log.createdAt, last: log.createdAt });
      continue;
    }
    existing.count += 1;
    if (log.createdAt < existing.first) existing.first = log.createdAt;
    if (log.createdAt > existing.last) existing.last = log.createdAt;
    if (severityRank(log.severity) > severityRank(existing.severity)) {
      existing.severity = log.severity;
      existing.title = log.message;
    }
  }

  const recurring = Array.from(groups.entries()).filter(([, g]) => g.count >= MIN_OCCURRENCES);

  await Promise.all(
    recurring.map(async ([fingerprint, g]) => {
      const existing = await prisma.incident.findUnique({ where: { fingerprint } });

      if (!existing) {
        await prisma.incident.create({
          data: {
            title: g.title.slice(0, 200),
            severity: mapSeverity(g.severity),
            category: g.category,
            fingerprint,
            firstDetectedAt: g.first,
            lastDetectedAt: g.last,
            occurrenceCount: g.count,
          },
        });
        return;
      }

      // A previously resolved/closed incident happening again is a
      // regression worth re-surfacing — reopen it. An actively OPEN or
      // INVESTIGATING incident's status is left alone (don't fight a
      // developer who's already working it).
      const isRegression =
        (existing.status === "RESOLVED" || existing.status === "CLOSED") && g.last > existing.lastDetectedAt;

      await prisma.incident.update({
        where: { fingerprint },
        data: {
          lastDetectedAt: g.last,
          occurrenceCount: g.count,
          severity: mapSeverity(g.severity),
          ...(isRegression ? { status: "OPEN" as const } : {}),
        },
      });
    })
  );
}
