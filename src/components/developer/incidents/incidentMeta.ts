// src/components/developer/incidents/incidentMeta.ts

export const INCIDENT_SEVERITY_META: Record<string, { label: string; color: string; bg: string }> = {
  LOW:      { label: "منخفضة", color: "#1A6B47", bg: "rgba(26,107,71,0.1)" },
  MEDIUM:   { label: "متوسطة", color: "#8B6914", bg: "rgba(201,168,76,0.14)" },
  HIGH:     { label: "عالية",  color: "#B3261E", bg: "rgba(179,38,30,0.1)" },
  CRITICAL: { label: "حرجة",   color: "#fff",     bg: "#B3261E" },
};

export const INCIDENT_STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  OPEN:          { label: "مفتوحة",      color: "#B3261E", bg: "rgba(179,38,30,0.08)",  icon: "●" },
  INVESTIGATING: { label: "قيد الفحص",   color: "#8B6914", bg: "rgba(201,168,76,0.14)", icon: "◐" },
  RESOLVED:      { label: "محلولة",      color: "#1A6B47", bg: "rgba(26,107,71,0.1)",   icon: "✓" },
  CLOSED:        { label: "مغلقة",       color: "#7A6E5A", bg: "rgba(122,110,90,0.1)",  icon: "○" },
};

export const CATEGORY_LABEL: Record<string, string> = {
  ERROR: "خطأ عام", EXCEPTION: "استثناء", API_FAILURE: "فشل API", AUTH: "مصادقة",
  SECURITY: "أمان", PERFORMANCE: "أداء", UPLOAD: "رفع ملفات", VIDEO: "فيديو",
  DATABASE: "قاعدة بيانات", BACKGROUND_JOB: "مهمة خلفية", SYSTEM: "نظام عام",
};

export function formatIncidentDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(date));
}
