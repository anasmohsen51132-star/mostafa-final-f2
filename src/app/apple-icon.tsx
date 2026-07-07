// src/app/apple-icon.tsx
//
// Next.js App Router convention: generates the Apple touch icon (used when
// a visitor adds the site to their iOS home screen) and auto-links it in
// <head> — same mechanism as icon.tsx, just at Apple's expected 180x180 size.
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
            fontSize: 108,
            color: "#FAF7F0",
            lineHeight: 1,
          }}
        >
          م
        </span>
      </div>
    ),
    { ...size }
  );
}
