// src/app/page.tsx
// Pure Server Component — no client-only imports at top level
import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TeacherSection } from "@/components/landing/TeacherSection";
import { CTASection } from "@/components/landing/CTASection";
import prisma from "@/lib/prisma";
import type { SiteSettings } from "@/types";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  organizationJsonLd,
  educationalOrganizationJsonLd,
  websiteJsonLd,
  breadcrumbJsonLd,
} from "@/lib/seo";

// SEO: homepage-specific metadata. This is the one page in the app where a
// canonical pointing at "/" (the site root) actually matters distinctly —
// nested pages inherit the root layout's metadata otherwise. Title/
// description here intentionally mirror the platform's real hero copy
// rather than generic boilerplate.
export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

async function getSettings(): Promise<Partial<SiteSettings> | null> {
  try {
    // Same fix as the customize route's PERF-003: read first, only create
    // the singleton row the very first time it doesn't exist, instead of
    // running a write on every single landing page view.
    let s = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    if (!s) {
      s = await prisma.siteSettings.create({ data: { id: "singleton" } });
    }
    return s as unknown as Partial<SiteSettings>;
  } catch {
    return null;
  }
}

export default async function LandingPage() {
  const settings = await getSettings();

  // SEO: JSON-LD structured data for the homepage. Rendered as plain JSON
  // text inside a <script> tag — standard Next.js pattern, no
  // dangerouslySetInnerHTML needed since JSON.stringify output is safe to
  // render as a text child. This is invisible, non-visual metadata only;
  // it does not change anything a visitor sees or any existing behavior.
  const jsonLd = [
    organizationJsonLd(),
    educationalOrganizationJsonLd(),
    websiteJsonLd(),
    breadcrumbJsonLd([{ name: "الرئيسية", path: "/" }]),
  ];

  return (
    <>
      {jsonLd.map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
      <main style={{ direction: "rtl" }}>
        <HeroSection settings={settings} />
        <FeaturesSection settings={settings} />
        <TeacherSection settings={settings} />
        <CTASection />
        <footer
          className="py-8 text-center"
          style={{ background: "#0D3D27", borderTop: "1px solid rgba(201,168,76,0.15)" }}
        >
          <p
            className="text-sm"
            style={{ color: "rgba(201,168,76,0.55)", fontFamily: "Amiri, serif" }}
          >
            {settings?.footerText ?? "© ٢٠٢٤ اكاديمية مستر مصطفى — جميع الحقوق محفوظة"}
          </p>
        </footer>
      </main>
    </>
  );
}
