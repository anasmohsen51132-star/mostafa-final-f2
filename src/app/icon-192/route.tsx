// src/app/icon-192/route.ts
//
// Serves a 192x192 PNG at /icon-192, referenced explicitly by src/app/manifest.ts.
// NOTE: this intentionally uses a plain Route Handler rather than Next's
// special icon.tsx naming convention — that convention only auto-detects
// exact reserved names (icon.tsx, apple-icon.tsx) or numbered suffixes
// (icon1.tsx, icon2.tsx) for the *favicon* <link> tags, not arbitrary names
// like "icon-192". A manifest.json icons[].src just needs *some* URL that
// serves an image, so a regular route handler returning ImageResponse is
// the reliable way to do that at a custom path.
import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #C9A84C 0%, #1A6B47 100%)",
        }}
      >
        <span
          style={{
            fontFamily: "serif",
            fontWeight: 700,
            fontSize: 118,
            color: "#FAF7F0",
            lineHeight: 1,
          }}
        >
          م
        </span>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
