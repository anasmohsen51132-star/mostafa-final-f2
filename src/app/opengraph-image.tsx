// src/app/opengraph-image.tsx
//
// Next.js App Router convention: generates the default `og:image` (and,
// since no separate twitter-image.tsx exists, Next also uses this as the
// Twitter card image per Next's documented fallback behavior) for every
// page under this segment that doesn't define its own. Served at
// /opengraph-image, auto-linked in <head> — no static image asset needed.
//
// BUGFIX: this previously rendered full Arabic words/sentences
// (e.g. "أكاديمية مستر مصطفى", "لتدريس اللغة العربية"). Vercel's built-in
// @vercel/og font engine (which next/og's ImageResponse uses under the
// hood) does not fully support the Arabic OpenType shaping tables needed
// to correctly join multiple Arabic letters together — it crashed at build
// time with "substFormat: 3 is not yet supported" the moment it hit a
// multi-letter Arabic word. A single ISOLATED Arabic letter (no
// neighbors, so no letter-joining/shaping needed at all) renders fine —
// that's exactly why icon.tsx/apple-icon.tsx/icon-192/icon-512 (which only
// ever render a single "م") never had this problem. The real fix for
// keeping actual shaped Arabic text here would be embedding a proper font
// file via ImageResponse's `fonts` option, but that adds a network fetch
// (or a bundled binary asset) at build time — for a purely decorative
// social-share image, that's not worth the added fragility. This image
// now uses the English name instead, which needs no special shaping and
// can never hit this crash; all of the site's actual Arabic metadata
// (title, description, JSON-LD, etc.) is untouched and unaffected.
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0D3D27 0%, #1A6B47 60%, #0D3D27 100%)",
          padding: 80,
        }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #C9A84C 0%, #8B6914 100%)",
            marginBottom: 40,
          }}
        >
          {/* Single isolated Arabic letter — safe, no joining/shaping needed */}
          <span style={{ fontFamily: "serif", fontWeight: 700, fontSize: 76, color: "#1A1208" }}>
            م
          </span>
        </div>
        <div
          style={{
            fontFamily: "sans-serif",
            fontWeight: 700,
            fontSize: 58,
            color: "#E8C97A",
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          Mostafa Academy
        </div>
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: 28,
            color: "rgba(250,247,240,0.8)",
            marginTop: 18,
            textAlign: "center",
          }}
        >
          Arabic Language Learning Platform
        </div>
      </div>
    ),
    { ...size }
  );
}
