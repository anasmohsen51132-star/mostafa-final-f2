// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./luxury-enhancements.css";
import { Providers } from "./providers";
import { SITE_URL, SITE_NAME, SITE_NAME_SHORT, SITE_DESCRIPTION, SITE_KEYWORDS, DEFAULT_LOCALE } from "@/lib/seo";

// SEO NOTE: `icons` and `manifest` are intentionally NOT set on this
// metadata object. Next.js's file-based conventions — src/app/icon.tsx,
// src/app/apple-icon.tsx, and src/app/manifest.ts — already generate and
// auto-link the correct <link> tags for all of these. Explicitly setting
// `metadata.icons` here would override and disable the file-based icons
// entirely (this is documented Next.js behavior), so the two approaches
// must not be mixed.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME_SHORT}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  applicationName: SITE_NAME_SHORT,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: DEFAULT_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1A6B47", // brand emerald, matches manifest.ts theme_color
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
