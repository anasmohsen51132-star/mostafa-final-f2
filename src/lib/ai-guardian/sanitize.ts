// src/lib/ai-guardian/sanitize.ts
//
// Defense-in-depth redaction pass, run on the PlatformSnapshot immediately
// before it's serialized into a prompt for any AI provider. The snapshot
// is already pre-aggregated (counts/messages/categories — see
// monitoring/systemLogSource.ts, which never selects ip/userId/metadata),
// so this mainly guards against a future log call site accidentally
// embedding something sensitive directly inside a `message` string.
//
// Every AI provider call in this module MUST go through sanitizeSnapshot()
// first — see promptBuilder.ts.
import type { PlatformSnapshot } from "@/lib/ai-guardian/monitoring/contracts";

const REDACTIONS: { pattern: RegExp; replacement: string }[] = [
  // Egyptian/international-style phone numbers
  { pattern: /(?:\+?\d{1,3}[\s-]?)?(?:01[0-25]\d{8}|\d{9,13})\b/g, replacement: "[هاتف مُخفى]" },
  // Emails
  { pattern: /[\w.+-]+@[\w-]+\.[\w.-]+/g, replacement: "[بريد مُخفى]" },
  // JWTs (three base64url segments separated by dots)
  { pattern: /\beyJ[\w-]+\.[\w-]+\.[\w-]+\b/g, replacement: "[JWT مُخفى]" },
  // Generic long hex/base64 tokens/secrets (32+ chars)
  { pattern: /\b[A-Za-z0-9_-]{32,}\b/g, replacement: "[قيمة سرية مُخفاة]" },
];

function redact(text: string): string {
  let out = text;
  for (const { pattern, replacement } of REDACTIONS) out = out.replace(pattern, replacement);
  return out;
}

export function sanitizeSnapshot(snapshot: PlatformSnapshot): PlatformSnapshot {
  return {
    ...snapshot,
    errors: {
      ...snapshot.errors,
      topRecurring: snapshot.errors.topRecurring.map((r) => ({ ...r, message: redact(r.message) })),
    },
    security: {
      ...snapshot.security,
      topEvents: snapshot.security.topEvents.map((e) => ({ ...e, message: redact(e.message) })),
    },
    systemEvents: {
      ...snapshot.systemEvents,
      recentEvents: snapshot.systemEvents.recentEvents.map((e) => ({ ...e, message: redact(e.message) })),
    },
  };
}
