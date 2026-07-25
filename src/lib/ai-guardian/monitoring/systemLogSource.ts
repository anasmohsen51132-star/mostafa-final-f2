// src/lib/ai-guardian/monitoring/systemLogSource.ts
//
// Real data source for the sections the AI Guardian can already report on
// today, reading Task 2's SystemLog table (src/lib/logger.ts / Error
// Center). Nothing here touches or assumes anything about Task 3.
import prisma from "@/lib/prisma";
import type {
  ErrorSummary, AuthSummary, SecuritySummary, SystemEventSummary,
  ErrorMetricsSource, AuthMetricsSource, SecurityMetricsSource, SystemEventsSource,
} from "@/lib/ai-guardian/monitoring/contracts";

function windowStart(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export const systemLogSource: ErrorMetricsSource & AuthMetricsSource & SecurityMetricsSource & SystemEventsSource = {
  async getErrorSummary(windowHours) {
    const since = windowStart(windowHours);
    const where = {
      createdAt: { gte: since },
      severity: { in: ["ERROR", "CRITICAL", "WARNING"] as const },
    };

    const [totalErrors, totalCritical, totalWarnings, unresolvedCount, grouped] = await Promise.all([
      prisma.systemLog.count({ where: { ...where, severity: "ERROR" } }),
      prisma.systemLog.count({ where: { ...where, severity: "CRITICAL" } }),
      prisma.systemLog.count({ where: { ...where, severity: "WARNING" } }),
      prisma.systemLog.count({ where: { ...where, resolved: false } }),
      prisma.systemLog.groupBy({
        by: ["message", "category"],
        where,
        _count: { _all: true },
        orderBy: { _count: { _all: "desc" } },
        take: 8,
      }),
    ]);

    const byCategoryRaw = await prisma.systemLog.groupBy({
      by: ["category"],
      where,
      _count: { _all: true },
    });

    const byCategory: Record<string, number> = {};
    for (const row of byCategoryRaw) byCategory[row.category] = row._count._all;

    return {
      windowHours,
      totalErrors,
      totalCritical,
      totalWarnings,
      unresolvedCount,
      topRecurring: grouped.map((g: { message: string; category: string; _count: { _all: number } }) => ({
        message: g.message, category: g.category, count: g._count._all,
      })),
      byCategory,
    } satisfies ErrorSummary;
  },

  async getAuthSummary(windowHours) {
    const since = windowStart(windowHours);
    const base = { createdAt: { gte: since }, route: "/api/auth/login" as const };

    const [successfulLogins, failedLogins, blockedAccountAttempts, rateLimitHits] = await Promise.all([
      prisma.systemLog.count({ where: { ...base, category: "AUTH", severity: "INFO" } }),
      prisma.systemLog.count({ where: { ...base, category: "SECURITY", severity: "WARNING", message: { contains: "بيانات غير صحيحة" } } }),
      prisma.systemLog.count({ where: { ...base, category: "AUTH", severity: "WARNING", message: { contains: "موقوف" } } }),
      prisma.systemLog.count({ where: { ...base, category: "SECURITY", severity: "WARNING", message: { contains: "تجاوز الحد" } } }),
    ]);

    return { windowHours, successfulLogins, failedLogins, blockedAccountAttempts, rateLimitHits } satisfies AuthSummary;
  },

  async getSecuritySummary(windowHours) {
    const since = windowStart(windowHours);
    const where = { createdAt: { gte: since }, category: "SECURITY" as const };

    const [securityEventCount, grouped] = await Promise.all([
      prisma.systemLog.count({ where }),
      prisma.systemLog.groupBy({
        by: ["message"],
        where,
        _count: { _all: true },
        orderBy: { _count: { _all: "desc" } },
        take: 5,
      }),
    ]);

    return {
      windowHours,
      securityEventCount,
      topEvents: grouped.map((g: { message: string; _count: { _all: number } }) => ({ message: g.message, count: g._count._all })),
    } satisfies SecuritySummary;
  },

  async getSystemEvents(windowHours) {
    const since = windowStart(windowHours);
    const rows = await prisma.systemLog.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { message: true, category: true, severity: true, createdAt: true },
    });

    return {
      windowHours,
      recentEvents: rows.map((r: { message: string; category: string; severity: string; createdAt: Date }) => ({
        message: r.message, category: r.category, severity: r.severity, at: r.createdAt.toISOString(),
      })),
    } satisfies SystemEventSummary;
  },
};
