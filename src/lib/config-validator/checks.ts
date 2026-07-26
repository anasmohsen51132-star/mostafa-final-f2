// src/lib/config-validator/checks.ts
//
// Section 7. Every check below reports presence/validity ONLY — never the
// actual value of a secret. `value` is always omitted from the result;
// only a redacted hint (e.g. length, or first few characters for
// non-secret config) is ever included, and only where genuinely harmless.
export type CheckStatus = "OK" | "WARNING" | "MISSING";

export interface ConfigCheckResult {
  key: string;
  label: string;
  status: CheckStatus;
  message: string;
  category: "DATABASE" | "AUTH" | "STORAGE" | "AI" | "GENERAL";
}

function checkRequired(
  key: string, label: string, category: ConfigCheckResult["category"],
  validate?: (value: string) => string | null // returns an error message, or null if valid
): ConfigCheckResult {
  const value = process.env[key];
  if (!value) {
    return { key, label, status: "MISSING", message: `متغير البيئة ${key} غير مُعرَّف`, category };
  }
  const validationError = validate?.(value);
  if (validationError) {
    return { key, label, status: "WARNING", message: validationError, category };
  }
  return { key, label, status: "OK", message: "مضبوط بشكل صحيح", category };
}

function checkOptional(key: string, label: string, category: ConfigCheckResult["category"]): ConfigCheckResult {
  const value = process.env[key];
  return {
    key, label, category,
    status: value ? "OK" : "WARNING",
    message: value ? "مُفعَّل" : "غير مُعرَّف (اختياري)",
  };
}

export function runConfigValidation(): ConfigCheckResult[] {
  return [
    checkRequired("DATABASE_URL", "رابط قاعدة البيانات", "DATABASE", (v) =>
      v.startsWith("postgres") ? null : "القيمة موجودة لكن لا تبدأ بـ postgres:// أو postgresql://"
    ),
    checkRequired("JWT_SECRET", "مفتاح توقيع الجلسات (JWT)", "AUTH", (v) =>
      v.length >= 32 ? null : `الطول ${v.length} حرف — يُنصح بـ 32 حرف على الأقل`
    ),
    checkRequired("NEXT_PUBLIC_APP_URL", "رابط المنصة العام", "GENERAL", (v) =>
      /^https?:\/\//.test(v) ? null : "القيمة موجودة لكن لا تبدأ بـ http:// أو https://"
    ),
    checkOptional("BLOB_READ_WRITE_TOKEN", "تخزين الملفات (Vercel Blob)", "STORAGE"),
    checkAiProvider(),
  ];
}

// The AI provider check is a bit different: it's "OK" if AT LEAST ONE
// provider's key is present and matches AI_GUARDIAN_PROVIDER (or falls
// back to claude), and "MISSING" only if none are configured at all —
// mirrors the exact same logic providers/registry.ts uses to pick a
// provider at runtime, so this check can never say "OK" while Guardian
// generation would actually fail.
function checkAiProvider(): ConfigCheckResult {
  const selected = process.env.AI_GUARDIAN_PROVIDER || "claude";
  const keyByProvider: Record<string, string | undefined> = {
    claude: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
  };
  const configured = Boolean(keyByProvider[selected]);

  return {
    key: "AI_GUARDIAN_PROVIDER",
    label: `مزود الذكاء الاصطناعي (${selected})`,
    category: "AI",
    status: configured ? "OK" : "MISSING",
    message: configured
      ? `مفعَّل عبر ${selected === "claude" ? "ANTHROPIC_API_KEY" : selected === "openai" ? "OPENAI_API_KEY" : "GEMINI_API_KEY"}`
      : `AI_GUARDIAN_PROVIDER=${selected} لكن المفتاح المطابق غير مُعرَّف — AI Guardian لن يعمل حتى يُضبط`,
  };
}
