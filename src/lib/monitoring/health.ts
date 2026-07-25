// src/lib/monitoring/health.ts
//
// Section 1 (System Health). A single 0–100 score + HEALTHY/WARNING/
// CRITICAL status, derived entirely from the real signals the other
// monitoring modules already computed — no separate data source, no
// arbitrary/fake baseline. Scoring weights are a simple, documented,
// easily-adjustable rubric rather than anything more elaborate — this is
// explicitly NOT the AI-driven analysis Task 3 rules out (Section 9), just
// a deterministic function of real numbers.
import type {
  SystemHealth, DatabaseMetrics, StorageMetrics, ApiMetrics, PlatformMetrics,
} from "./types";

export function computeSystemHealth(
  db: DatabaseMetrics,
  storage: StorageMetrics,
  api: ApiMetrics,
  platform: PlatformMetrics
): SystemHealth {
  let score = 100;
  const reasons: string[] = [];

  if (!db.connected) {
    score -= 50;
    reasons.push("قاعدة البيانات غير متصلة");
  } else if (db.latencyMs !== null && db.latencyMs > 500) {
    score -= 10;
    reasons.push("استجابة قاعدة البيانات بطيئة");
  }

  if (storage.status === "CRITICAL") {
    score -= 20;
    reasons.push("التخزين (Blob) غير سليم");
  } else if (storage.status === "WARNING") {
    score -= 5;
    reasons.push("بعض عمليات رفع الملفات فشلت مؤخراً");
  }

  if (api.successRatePct !== null) {
    if (api.successRatePct < 90) {
      score -= 20;
      reasons.push("نسبة نجاح الطلبات منخفضة");
    } else if (api.successRatePct < 98) {
      score -= 8;
      reasons.push("نسبة نجاح الطلبات أقل من المعتاد");
    }
  }

  if (platform.criticalEventsToday > 0) {
    score -= Math.min(20, platform.criticalEventsToday * 5);
    reasons.push(`${platform.criticalEventsToday} حدث حرج اليوم`);
  }
  if (platform.errorsToday > 10) {
    score -= 10;
    reasons.push("عدد كبير من الأخطاء اليوم");
  }

  score = Math.max(0, Math.min(100, score));

  const status: SystemHealth["status"] = score >= 85 ? "HEALTHY" : score >= 60 ? "WARNING" : "CRITICAL";

  return { score, status, reasons };
}
