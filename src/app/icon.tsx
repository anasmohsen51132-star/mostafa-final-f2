// src/app/icon.tsx
//
// Next.js App Router convention: this generates the site's favicon at
// build/request time (via next/og's ImageResponse) and Next.js
// automatically serves it at /icon and links it in every page's <head> —
// no static .ico file to manage, and no external design asset needed.
//
// The design mirrors the emerald/gold circular-avatar style already used
// throughout the app for user initials (see Sidebar.tsx, Navbar, etc.):
// a gold-to-emerald gradient with the "م" (Mīm, for "Mostafa") letter.
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 7,
        }}
      >
        <span
          style={{
            fontFamily: "serif",
            fontWeight: 700,
            fontSize: 20,
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
