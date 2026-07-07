// src/app/(auth)/register/layout.tsx
// See src/app/(auth)/login/layout.tsx for why this thin wrapper exists.
import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "إنشاء حساب جديد",
  description: `أنشئ حسابك المجاني في ${SITE_NAME} وابدأ رحلتك في تعلّم اللغة العربية.`,
  alternates: {
    canonical: `${SITE_URL}/register`,
  },
  // See login/layout.tsx: transactional pages are crawlable but not
  // meant to appear in search results themselves.
  robots: { index: false, follow: true },
  openGraph: {
    title: `إنشاء حساب جديد — ${SITE_NAME}`,
    description: `أنشئ حسابك المجاني في ${SITE_NAME}.`,
    url: `${SITE_URL}/register`,
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
