// src/components/developer/logs/logMeta.ts
//
// Single source of truth for how severities/categories are labeled and
// colored across the Developer Dashboard — used by LogFilterBar, LogList,
// and the error detail page, so none of them can drift out of sync with
// each other. Mirrors the pattern already used for roleLabel() in
// src/lib/utils.ts.

export const LOG_SEVERITIES = ["INFO", "WARNING", "ERROR", "CRITICAL"] as const;
export type LogSeverityValue = (typeof LOG_SEVERITIES)[number];

export const LOG_CATEGORIES = [
  "ERROR", "EXCEPTION", "API_FAILURE", "AUTH", "SECURITY", "PERFORMANCE",
  "UPLOAD", "VIDEO", "DATABASE", "BACKGROUND_JOB", "SYSTEM",
] as const;
export type LogCategoryValue = (typeof LOG_CATEGORIES)[number];

interface SeverityMeta {
  label: string;
  color: string;
  bg: string;
}

export const SEVERITY_META: Record<LogSeverityValue, SeverityMeta> = {
  INFO:     { label: "معلومة",  color: "#1A6B47", bg: "rgba(26,107,71,0.1)" },
  WARNING:  { label: "تحذير",   color: "#8B6914", bg: "rgba(201,168,76,0.14)" },
  ERROR:    { label: "خطأ",     color: "#B3261E", bg: "rgba(179,38,30,0.1)" },
  CRITICAL: { label: "حرج",     color: "#fff",     bg: "#B3261E" },
};

interface CategoryMeta {
  label: string;
  icon: string;
}

export const CATEGORY_META: Record<LogCategoryValue, CategoryMeta> = {
  ERROR:          { label: "خطأ عام",           icon: "⚠️" },
  EXCEPTION:      { label: "استثناء غير متوقع",  icon: "💥" },
  API_FAILURE:    { label: "فشل API",            icon: "🔌" },
  AUTH:           { label: "مصادقة",             icon: "🔑" },
  SECURITY:       { label: "أمان",               icon: "🔒" },
  PERFORMANCE:    { label: "أداء",               icon: "⚡" },
  UPLOAD:         { label: "رفع ملفات",          icon: "📤" },
  VIDEO:          { label: "فيديو",              icon: "🎬" },
  DATABASE:       { label: "قاعدة بيانات",       icon: "🗄️" },
  BACKGROUND_JOB: { label: "مهمة خلفية",         icon: "⚙️" },
  SYSTEM:         { label: "نظام عام",           icon: "🖥️" },
};

export function formatLogDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).format(new Date(date));
}
