// src/components/developer/ai-guardian/guardianMeta.ts

export const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  HEALTHY:  { label: "سليم",  color: "#1A6B47", bg: "rgba(26,107,71,0.1)" },
  WARNING:  { label: "تحذير", color: "#8B6914", bg: "rgba(201,168,76,0.14)" },
  CRITICAL: { label: "حرج",   color: "#fff",     bg: "#B3261E" },
  UNKNOWN:  { label: "غير معروف", color: "#7A6E5A", bg: "rgba(122,110,90,0.1)" },
};

export const PRIORITY_META: Record<string, { label: string; color: string; bg: string }> = {
  LOW:    { label: "منخفضة", color: "#1A6B47", bg: "rgba(26,107,71,0.1)" },
  MEDIUM: { label: "متوسطة", color: "#8B6914", bg: "rgba(201,168,76,0.14)" },
  HIGH:   { label: "عالية",  color: "#B3261E", bg: "rgba(179,38,30,0.1)" },
  URGENT: { label: "عاجلة",  color: "#fff",     bg: "#B3261E" },
};

export const INSIGHT_SEVERITY_META: Record<string, { label: string; color: string; bg: string }> = {
  INFO:     { label: "معلومة", color: "#1A6B47", bg: "rgba(26,107,71,0.1)" },
  WARNING:  { label: "تحذير",  color: "#8B6914", bg: "rgba(201,168,76,0.14)" },
  CRITICAL: { label: "حرج",    color: "#fff",     bg: "#B3261E" },
};

export const CATEGORY_LABEL: Record<string, string> = {
  PERFORMANCE: "الأداء", DATABASE: "قاعدة البيانات", AUTH: "المصادقة",
  STORAGE: "التخزين", SECURITY: "الأمان", API: "API", SYSTEM: "النظام",
};

export const COMPONENT_LABEL: Record<string, string> = {
  PERFORMANCE: "الأداء", DATABASE: "قاعدة البيانات", AUTHENTICATION: "المصادقة",
  STORAGE: "التخزين", SECURITY: "الأمان", API: "API",
};

export const RISK_META: Record<string, { label: string; icon: string }> = {
  DATABASE_SATURATION: { label: "تشبّع قاعدة البيانات", icon: "🗄️" },
  STORAGE_EXHAUSTION:  { label: "نفاد مساحة التخزين",   icon: "📦" },
  API_INSTABILITY:     { label: "عدم استقرار API",       icon: "🔌" },
  AUTH_DEGRADATION:    { label: "تدهور نظام المصادقة",   icon: "🔑" },
  MEMORY_PRESSURE:     { label: "ضغط على الذاكرة",       icon: "💾" },
  TRAFFIC_SPIKE:       { label: "ارتفاع مفاجئ في الحركة", icon: "📈" },
  OTHER:                { label: "خطر آخر",              icon: "⚠️" },
};

export function formatGuardianDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(date));
}
