// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// YouTube ID obfuscation
// Multi-layer: XOR cipher + hex + reverse + base64url
// encode runs server-side only (Node Buffer OK)
// decode runs client + server — uses browser-safe atob/btoa path
// ============================================================

const XOR_KEY = [0x4d, 0x75, 0x73, 0x74, 0x61, 0x66, 0x61]; // "Mustafa"

function xorBytes(input: string): number[] {
  return input.split("").map((c, i) => c.charCodeAt(0) ^ XOR_KEY[i % XOR_KEY.length]);
}
function unxorBytes(bytes: number[]): string {
  return bytes.map((b, i) => String.fromCharCode(b ^ XOR_KEY[i % XOR_KEY.length])).join("");
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

// Server-only encoder (uses Node Buffer)
export function encodeYouTubeId(videoId: string): string {
  const xored = xorBytes(videoId);
  const hex   = xored.map((b) => b.toString(16).padStart(2, "0")).join("");
  const rev   = hex.split("").reverse().join("");
  // Use Buffer on server, fallback to btoa for safety
  if (typeof Buffer !== "undefined") {
    return Buffer.from(rev).toString("base64url");
  }
  return btoa(rev).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Browser + server safe decoder
export function decodeYouTubeId(encoded: string): string {
  try {
    // Normalise base64url → base64
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    // Padding
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);

    let rev: string;
    if (typeof Buffer !== "undefined") {
      rev = Buffer.from(padded, "base64").toString("utf8");
    } else {
      rev = atob(padded);
    }

    const hex   = rev.split("").reverse().join("");
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.slice(i, i + 2), 16));
    }
    const result = unxorBytes(bytes);
    // Validate: YouTube IDs are exactly 11 chars [a-zA-Z0-9_-]
    if (/^[a-zA-Z0-9_-]{11}$/.test(result)) return result;

    // Fallback: maybe it was stored as plain base64
    throw new Error("invalid");
  } catch {
    try {
      // Plain base64 fallback for rows stored by older code
      const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
      if (typeof Buffer !== "undefined") {
        return Buffer.from(b64, "base64").toString("utf8");
      }
      return atob(b64);
    } catch {
      return encoded;
    }
  }
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
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCode(length = 10): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
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
