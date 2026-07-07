// src/app/(auth)/login/layout.tsx
//
// src/app/(auth)/login/page.tsx is a Client Component ("use client"), and
// Next.js only allows `metadata`/`generateMetadata` exports from Server
// Components. This thin layout exists solely to attach metadata to the
// /login route without touching the existing client page at all — it just
// renders `children` straight through.
import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: `سجّل دخولك إلى ${SITE_NAME} لمتابعة دروسك واختباراتك وواجباتك.`,
  alternates: {
    canonical: `${SITE_URL}/login`,
  },
  // SEO: a login form has no content worth ranking in search results, and
  // indexing it can look confusing/spammy to searchers. `index: false`
  // keeps it out of search results while `follow: true` still lets Google
  // crawl through it (as opposed to disallowing it in robots.txt, which
  // would block crawling entirely — see the note in robots.ts).
  robots: { index: false, follow: true },
  openGraph: {
    title: `تسجيل الدخول — ${SITE_NAME}`,
    description: `سجّل دخولك إلى ${SITE_NAME}.`,
    url: `${SITE_URL}/login`,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
