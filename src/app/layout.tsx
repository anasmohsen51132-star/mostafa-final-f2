// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "اكاديمية مستر مصطفى — منصة تعليم اللغة العربية",
  description: "منصة تعليمية متكاملة لتدريس اللغة العربية لجميع المراحل الدراسية",
  keywords: "تعليم, اللغة العربية, اكاديمية, دورات, لغة عربية",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
