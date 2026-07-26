// src/lib/incidents/fingerprint.ts
//
// Turns a (category, message) pair into a stable dedup key so the same
// recurring problem always maps to the same Incident row instead of
// spawning a new one every time it happens again.
export function buildFingerprint(category: string, message: string): string {
  const normalized = message
    .toLowerCase()
    .trim()
    // Strip obviously variable parts (ids, numbers, quoted values) so
    // "فشل في المستخدم user_123" and "فشل في المستخدم user_456" collapse
    // to the same fingerprint instead of becoming two incidents.
    .replace(/[0-9a-f]{8,}/gi, "#")
    .replace(/\d+/g, "#")
    .replace(/\s+/g, " ")
    .slice(0, 160);

  return `${category}:${normalized}`;
}
