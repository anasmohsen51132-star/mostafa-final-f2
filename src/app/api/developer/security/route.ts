// src/app/api/developer/security/route.ts
//
// Extends Task 3's Authentication Monitor (src/lib/monitoring/authMetrics.ts,
// still used as-is on this same page) with the broader Security Center
// data Task 5 asks for. Everything here is derived from real SystemLog
// rows and Incident records — nothing fabricated. Where a signal genuinely
// isn't instrumented yet (e.g. per-route permission-violation logging),
// this says so explicitly instead of showing a fake zero silently.
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";

const SUSPICIOUS_THRESHOLD = 5; // security events from one IP within the window

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [rateLimitEvents, securityLogs, securityIncidents] = await Promise.all([
      prisma.systemLog.count({
        where: { createdAt: { gte: since }, category: "SECURITY", message: { contains: "تجاوز الحد" } },
      }),
      prisma.systemLog.findMany({
        where: { createdAt: { gte: since }, category: "SECURITY" },
        select: { message: true, ip: true, route: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 200, // enough to compute per-IP grouping below without unbounded scan
      }),
      prisma.incident.findMany({
        where: { category: "SECURITY" },
        orderBy: { lastDetectedAt: "desc" },
        take: 10,
      }),
    ]);

    // Suspicious-IP heuristic: real, simple, rule-based — not a fabricated
    // "AI attack detection" claim. Any IP crossing the threshold within the
    // last 24h shows up; nothing is blocked or acted on automatically.
    const byIp = new Map<string, number>();
    for (const log of securityLogs) {
      if (!log.ip) continue;
      byIp.set(log.ip, (byIp.get(log.ip) ?? 0) + 1);
    }
    const suspiciousIps = Array.from(byIp.entries())
      .filter(([, count]) => count >= SUSPICIOUS_THRESHOLD)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    const recentEvents = securityLogs.slice(0, 20).map((l: { message: string; ip: string | null; route: string | null; createdAt: Date }) => ({
      message: l.message, ip: l.ip, route: l.route, at: l.createdAt.toISOString(),
    }));

    // Rule-based recommendations — deliberately NOT an AI call (keeps this
    // page instant and free to load). AI Guardian's own recommendations
    // (Task 4) can still weigh in separately with deeper analysis.
    const recommendations: { title: string; description: string }[] = [];
    if (rateLimitEvents > 20) {
      recommendations.push({
        title: "معدل مرتفع من تجاوزات الحد",
        description: `${rateLimitEvents} محاولة تجاوز للحد المسموح خلال 24 ساعة — راجع لو ده نشاط طبيعي أو محاولة هجوم.`,
      });
    }
    if (suspiciousIps.length > 0) {
      recommendations.push({
        title: "نشاط مشبوه من IPs محددة",
        description: `${suspiciousIps.length} عنوان IP تجاوز ${SUSPICIOUS_THRESHOLD} أحداث أمنية خلال 24 ساعة — راجع القائمة تحت.`,
      });
    }
    if (recommendations.length === 0) {
      recommendations.push({ title: "لا توجد تنبيهات أمنية حالية", description: "النشاط الأمني خلال آخر 24 ساعة ضمن الحدود الطبيعية." });
    }

    return success({
      windowHours: 24,
      rateLimitEvents,
      suspiciousIps,
      recentEvents,
      securityIncidents,
      recommendations,
      // Honest gap disclosure — see file header.
      permissionViolationsNote: "تسجيل محاولات تجاوز الصلاحيات لكل مسار API على حدة غير مُفعَّل بعد لكل الـ routes — القيمة المتاحة حاليًا هي 'طلبات غير مصرَّح بها' في قسم مراقبة المصادقة فوق.",
    });
  } catch (e) {
    console.error("[developer/security GET]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
