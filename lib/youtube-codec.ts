// src/lib/youtube-codec.ts
//
// SEC-003 FOLLOW-UP: this used to live in src/lib/utils.ts, which is
// imported by client components all over the app (cn(), etc.) — so
// XOR_KEY and decodeYouTubeId shipped into nearly every page's bundle even
// after VideoPlayer.tsx stopped calling decodeYouTubeId itself (server now
// decodes for students before sending — see /api/lectures/[id]/route.ts).
//
// Moving the codec to its own module, imported ONLY from:
//   - src/app/api/videos/route.ts        (encodeYouTubeId, on create)
//   - src/app/api/lectures/[id]/route.ts (decodeYouTubeId, server-side)
// means it never reaches a client bundle again — there is no remaining
// legitimate reason for any browser code to import this module.
//
// NOTE (unchanged from before): this XOR+hex+reverse+base64url scheme was
// NEVER a real security control and isn't one now either — it only avoids
// a one-time DB migration for already-encoded `youtubeId` values. The real
// protection is the server-side ownership check (userOwnsLecture) that runs
// before any video row is sent to a browser at all.
const XOR_KEY = [0x4d, 0x75, 0x73, 0x74, 0x61, 0x66, 0x61]; // "Mustafa"

function xorBytes(input: string): number[] {
  return input.split("").map((c, i) => c.charCodeAt(0) ^ XOR_KEY[i % XOR_KEY.length]);
}
function unxorBytes(bytes: number[]): string {
  return bytes.map((b, i) => String.fromCharCode(b ^ XOR_KEY[i % XOR_KEY.length])).join("");
}

// Server-only encoder (uses Node Buffer)
export function encodeYouTubeId(videoId: string): string {
  const xored = xorBytes(videoId);
  const hex   = xored.map((b) => b.toString(16).padStart(2, "0")).join("");
  const rev   = hex.split("").reverse().join("");
  if (typeof Buffer !== "undefined") {
    return Buffer.from(rev).toString("base64url");
  }
  return btoa(rev).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Server-only decoder
export function decodeYouTubeId(encoded: string): string {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
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
    if (/^[a-zA-Z0-9_-]{11}$/.test(result)) return result;

    throw new Error("invalid");
  } catch {
    try {
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
