// src/app/page.tsx
// Pure Server Component — no client-only imports at top level
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TeacherSection } from "@/components/landing/TeacherSection";
import { CTASection } from "@/components/landing/CTASection";
import prisma from "@/lib/prisma";
import { getVerifiedUser } from "@/lib/auth";
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

// AUTH-004: where each role lands when they're already logged in and hit
// the marketing homepage. Shared/admin surfaces for both ADMIN and OWNER
// live under /admin (see ADMIN_NAV in the (admin) layout) — OWNER-only
// extras like /owner/customize are additional pages reached from there,
// not a separate home.
function dashboardPathForRole(role: string): string {
  if (role === "DEVELOPER") return "/developer";
  if (role === "OWNER" || role === "ADMIN") return "/admin";
  return "/dashboard";
}

export default async function LandingPage() {
  // AUTH-004: an already-authenticated visitor hitting "/" should land in
  // their dashboard, not see the marketing hero again — this was the
  // reported gap. getCurrentUser() just decodes+verifies the JWT (no DB
  // round trip), so this costs nothing extra for the anonymous visitors
  // who make up most landing-page traffic; only a valid cookie triggers it.
  // Session validity beyond signature/expiry (e.g. single-device sid match)
  // is still fully re-checked client-side by SessionSync once they land on
  // the dashboard, so an already-invalidated session correctly bounces back
  // to /login from there rather than getting stuck.
  // AUTH-005 BUGFIX: this used to call getCurrentUser(), which only checks
  // the JWT's signature/expiry — not whether a newer login elsewhere has
  // since invalidated it (single-device enforcement). A stale-but-valid
  // cookie was redirecting straight to the dashboard, which then correctly
  // bounced back out to /login via the client-side check — meaning that
  // device could never actually see the homepage again. getVerifiedUser()
  // does the same DB check up front and clears the stale cookie if it
  // fails, so this only redirects for a session that's genuinely still valid.
  const currentUser = await getVerifiedUser();
  if (currentUser) redirect(dashboardPathForRole(currentUser.role));

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
        <CTASection settings={settings} />
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
          <p
            className="text-xs"
            style={{ color: "rgba(201,168,76,0.35)", fontFamily: "Cairo, sans-serif", marginTop: 8 }}
          >
            Developed by{" "}
            <a
              href="https://wa.me/201092828464"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#C9A84C", textDecoration: "none", fontWeight: 600 }}
            >
              Anas
            </a>
          </p>
        </footer>
      </main>
    </>
  );
}
