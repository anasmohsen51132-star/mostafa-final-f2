// src/components/developer/monitoring/StatTile.tsx
//
// One reusable card for every metric shown across Sections 1–6, matching
// src/components/developer/ComingSoonCard.tsx's exact card language so the
// whole developer dashboard reads as one consistent surface.
export function StatTile({
  label,
  value,
  icon,
  subLabel,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  icon?: string;
  subLabel?: string;
  tone?: "neutral" | "good" | "warning" | "bad";
}) {
  const toneColor = {
    neutral: "#1A1208",
    good:    "#1A6B47",
    warning: "#8B6914",
    bad:     "#B3261E",
  }[tone];

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.18)", boxShadow: "0 4px 16px rgba(26,18,8,0.05)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, fontWeight: 600 }}>
          {label}
        </span>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <div style={{ fontFamily: "Amiri,serif", color: toneColor, fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>
        {value}
      </div>
      {subLabel && (
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 11, marginTop: 4 }}>
          {subLabel}
        </p>
      )}
    </div>
  );
}
