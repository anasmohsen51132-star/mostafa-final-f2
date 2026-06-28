// src/components/ui/FullScreenSpinner.tsx
// ARCH-003 FIX: used by the (student)/(admin)/(owner) layouts while
// useAuthStore is still rehydrating from localStorage + syncing the full
// user from /api/auth/me (see SessionSync). Showing this instead of `null`
// (blank page) or evaluating redirect logic against incomplete data avoids
// a flash of the wrong state during that brief window.
export function FullScreenSpinner() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#FAF7F0" }}
    >
      <div
        className="w-10 h-10 rounded-full border-4 animate-spin"
        style={{ borderColor: "rgba(201,168,76,0.25)", borderTopColor: "#C9A84C" }}
        role="status"
        aria-label="جاري التحميل"
      />
    </div>
  );
}
