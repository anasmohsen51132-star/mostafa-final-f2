// src/components/developer/monitoring/MiniBarList.tsx
//
// Section 7 ("small charts where appropriate"). Deliberately a plain,
// dependency-free set of proportional <div> bars rather than pulling in a
// charting library — this app has none as a dependency today (confirmed
// against package.json), and a handful of horizontal bars doesn't warrant
// adding one just for this.
export function MiniBarList({
  items,
  valueLabel,
}: {
  items: { label: string; value: number; sub?: string }[];
  valueLabel: (v: number) => string;
}) {
  if (items.length === 0) {
    return (
      <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
        لا توجد بيانات كافية بعد
      </p>
    );
  }

  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 12, fontWeight: 600, direction: "ltr", textAlign: "right" }}>
              {item.label}
            </span>
            <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 11 }}>
              {valueLabel(item.value)}{item.sub ? ` · ${item.sub}` : ""}
            </span>
          </div>
          <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: "rgba(201,168,76,0.12)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${(item.value / max) * 100}%`, background: "linear-gradient(135deg,#C9A84C,#8B6914)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
