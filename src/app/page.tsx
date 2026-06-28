// src/app/page.tsx
// Pure Server Component — no client-only imports at top level
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TeacherSection } from "@/components/landing/TeacherSection";
import { CTASection } from "@/components/landing/CTASection";
import prisma from "@/lib/prisma";
import type { SiteSettings } from "@/types";

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

  return (
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
  );
}
