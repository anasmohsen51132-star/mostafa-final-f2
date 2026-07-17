"use client";
// src/app/providers.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { SessionSync } from "@/components/auth/SessionSync";
import { LazyMotionProvider } from "@/components/motion/LazyMotionProvider";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
          mutations: { retry: 0 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotionProvider>
        <SessionSync />
        {/* CUSTOM-010: site-wide, above everything else including the
            per-role layouts, so it shows for logged-out visitors on the
            landing page too, not just inside student/admin dashboards. */}
        <AnnouncementBar />
        {children}
      </LazyMotionProvider>
    </QueryClientProvider>
  );
}
