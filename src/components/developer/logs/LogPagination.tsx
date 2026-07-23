"use client";
// src/components/developer/logs/LogPagination.tsx
//
// Mirrors the exact pagination UI pattern already used in
// src/app/(admin)/admin/results/page.tsx, extracted here so the Error
// Center and System Events pages share one implementation.

interface LogPaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function LogPagination({ page, totalPages, onChange }: LogPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-5 flex-wrap" style={{ direction: "ltr" }}>
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        style={{
          padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.3)",
          background: "transparent", color: page === 1 ? "rgba(122,110,90,0.4)" : "#7A6E5A",
          fontFamily: "Cairo,sans-serif", fontSize: 13, cursor: page === 1 ? "default" : "pointer",
        }}
      >
        ‹ السابق
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
        .reduce<(number | "…")[]>((acc, p, i, arr) => {
          if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
          acc.push(p);
          return acc;
        }, [])
        .map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} style={{ color: "#7A6E5A", fontFamily: "Cairo,sans-serif", fontSize: 13, padding: "0 4px" }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              style={{
                minWidth: 34, padding: "6px 8px", borderRadius: 8,
                border: p === page ? "none" : "1px solid rgba(201,168,76,0.3)",
                background: p === page ? "linear-gradient(135deg,#C9A84C,#8B6914)" : "transparent",
                color: p === page ? "#1A1208" : "#7A6E5A",
                fontFamily: "Cairo,sans-serif", fontSize: 13, fontWeight: p === page ? 700 : 400,
                cursor: "pointer",
              }}
            >
              {p}
            </button>
          )
        )}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        style={{
          padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.3)",
          background: "transparent", color: page === totalPages ? "rgba(122,110,90,0.4)" : "#7A6E5A",
          fontFamily: "Cairo,sans-serif", fontSize: 13, cursor: page === totalPages ? "default" : "pointer",
        }}
      >
        التالي ›
      </button>
    </div>
  );
}
