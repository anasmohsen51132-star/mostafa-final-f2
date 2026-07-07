// src/app/icon-512/route.tsx
// Serves a 512x512 PNG at /icon-512 — see the note in icon-192/route.tsx
// for why this is a plain Route Handler rather than the icon.tsx convention.
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
            fontSize: 310,
            color: "#FAF7F0",
            lineHeight: 1,
          }}
        >
          م
        </span>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
