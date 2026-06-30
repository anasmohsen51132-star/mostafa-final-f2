// src/app/(student)/loading.tsx
// NEXT-002 FIX: no loading.tsx existed in any route group — Next.js's
// App Router uses this file as an automatic Suspense boundary for page
// navigations and slow data fetches within the group; without it, users
// saw a blank page during that gap instead of a sensible loading state.
import { FullScreenSpinner } from "@/components/ui/FullScreenSpinner";

export default function StudentLoading() {
  return <FullScreenSpinner />;
}
