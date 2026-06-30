// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// ---- YouTube embed URL (browser-safe, no Buffer) ----
export function buildYouTubeEmbedUrl(rawId: string, origin: string): string {
  const p = new URLSearchParams({
    autoplay:        "1",
    rel:             "0",
    modestbranding:  "1",
    showinfo:        "0",
    iv_load_policy:  "3",
    cc_load_policy:  "0",
    disablekb:       "1",
    fs:              "1",
    controls:        "1",
    enablejsapi:     "1",
    playsinline:     "1",
    origin,
    widget_referrer: origin,
  });
  return `https://www.youtube-nocookie.com/embed/${rawId}?${p.toString()}`;
}

// ---- Access code generation ----
// SEC-012 FIX: Math.random() is not cryptographically secure and is predictable.
// We now use the Web Crypto API (available in both Node 18+ and Edge runtimes)
// to pick each character via a uniformly-distributed secure random index.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function secureRandomIndex(max: number): number {
  // Rejection sampling to avoid modulo bias
  const range = 256 - (256 % max);
  const buf = new Uint8Array(1);
  let x: number;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= range);
  return x % max;
}

export function generateCode(length = 10): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += CODE_CHARS[secureRandomIndex(CODE_CHARS.length)];
  }
  return code;
}

export function generateCodes(count: number): string[] {
  const set = new Set<string>();
  while (set.size < count) set.add(generateCode());
  return Array.from(set);
}

// ---- Format helpers ----
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric", month: "long", day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(date));
}

// ---- API response helpers ----
export function success<T>(data: T) {
  return Response.json({ success: true, data });
}
export function error(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}
export function unauthorized(msg = "غير مصرح") {
  return Response.json({ success: false, error: msg }, { status: 401 });
}
export function forbidden(msg = "ليس لديك صلاحية") {
  return Response.json({ success: false, error: msg }, { status: 403 });
}
export function notFound(msg = "العنصر غير موجود") {
  return Response.json({ success: false, error: msg }, { status: 404 });
}

// ---- Phone normalization ----
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-]/g, "");
}

// ---- Role display ----
export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    OWNER:   "👑 مالك",
    ADMIN:   "🔵 مدير",
    STUDENT: "🟢 طالب",
  };
  return map[role] || role;
}

// ---- Percentage ----
export function pct(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}
