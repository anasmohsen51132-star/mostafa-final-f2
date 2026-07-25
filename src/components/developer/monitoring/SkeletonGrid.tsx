// src/components/developer/monitoring/SkeletonGrid.tsx
//
// The same pulsing-placeholder grid was being repeated across every
// monitoring page's loading state — factored out once here instead.
export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl animate-pulse" style={{ height: 96, background: "rgba(201,168,76,0.08)" }} />
      ))}
    </div>
  );
}
