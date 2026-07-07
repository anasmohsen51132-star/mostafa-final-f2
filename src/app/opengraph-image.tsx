// src/app/opengraph-image.tsx
//
// Next.js App Router convention: generates the default `og:image` (and,
// since no separate twitter-image.tsx exists, Next also uses this as the
// Twitter card image per Next's documented fallback behavior) for every
// page under this segment that doesn't define its own. Served at
// /opengraph-image, auto-linked in <head> — no static image asset needed.
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_NAME_SHORT } from "@/lib/seo";

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
          <span style={{ fontFamily: "serif", fontWeight: 700, fontSize: 76, color: "#1A1208" }}>
            م
          </span>
        </div>
        <div
          style={{
            fontFamily: "serif",
            fontWeight: 700,
            fontSize: 58,
            color: "#E8C97A",
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {SITE_NAME_SHORT}
        </div>
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: 30,
            color: "rgba(250,247,240,0.8)",
            marginTop: 18,
            textAlign: "center",
          }}
        >
          لتدريس اللغة العربية
        </div>
      </div>
    ),
    { ...size }
  );
}
