// src/app/layout.tsx
import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./luxury-enhancements.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "اكاديمية مستر مصطفى — منصة تعليم اللغة العربية",
  description: "منصة تعليمية متكاملة لتدريس اللغة العربية لجميع المراحل الدراسية",
  keywords: "تعليم, اللغة العربية, اكاديمية, دورات, لغة عربية",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // NEXT-003 FIX: reading headers() here is what matters, not the value
  // itself — it forces this layout to render dynamically per request
  // (required, since the nonce/CSP differ on every request and must never
  // be cached/shared across requests). Next.js automatically applies this
  // same nonce to its own internally-generated inline hydration scripts;
  // if a custom inline <script> is ever added directly in this app, pass
  // nonce={(await headers()).get("x-nonce")} to it explicitly.
  await headers();

  return (
    <html lang="ar" dir="rtl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
