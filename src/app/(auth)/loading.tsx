// src/app/(auth)/loading.tsx
// NEXT-001 FIX: see (student)/loading.tsx for context — this route group
// (login/register) was the one left out when loading.tsx was added to the
// other three route groups.
import { FullScreenSpinner } from "@/components/ui/FullScreenSpinner";

export default function AuthLoading() {
  return <FullScreenSpinner />;
}
