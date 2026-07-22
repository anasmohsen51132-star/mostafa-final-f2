"use client";
// src/components/theme/CtaButtonsEditor.tsx
import type { CtaButton } from "@/types";

interface Props {
  buttons: CtaButton[];
  onChange: (buttons: CtaButton[]) => void;
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px", borderRadius: 9, border: "1.5px solid rgba(201,168,76,0.25)",
  background: "#FAFAF8", color: "#1A1208", fontFamily: "Cairo,sans-serif",
  fontSize: 13, outline: "none",
};

export function CtaButtonsEditor({ buttons, onChange }: Props) {
  const sorted = [...buttons].sort((a, b) => a.order - b.order);

  const update = (id: string, patch: Partial<CtaButton>) =>
    onChange(buttons.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const move = (id: string, dir: -1 | 1) => {
    const idx = sorted.findIndex((b) => b.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    onChange(buttons.map((btn) => {
      if (btn.id === a.id) return { ...btn, order: b.order };
      if (btn.id === b.id) return { ...btn, order: a.order };
      return btn;
    }));
  };

  const remove = (id: string) => onChange(buttons.filter((b) => b.id !== id));

  const addButton = () => {
    const nextOrder = buttons.length ? Math.max(...buttons.map((b) => b.order)) + 1 : 0;
    onChange([...buttons, { id: `btn-${Date.now()}`, label: "زرار جديد", href: "/", visible: true, order: nextOrder }]);
  };

  return (
    <div>
      <div className="space-y-3">
        {sorted.map((b, i) => (
          <div key={b.id} className="rounded-xl p-3 flex flex-wrap items-center gap-2"
            style={{ background: "#FAFAF8", border: "1px solid rgba(201,168,76,0.18)" }}>
            <div className="flex flex-col gap-1">
              <button type="button" onClick={() => move(b.id, -1)} disabled={i === 0}
                style={{ opacity: i === 0 ? 0.3 : 1, background: "none", border: "none", cursor: i === 0 ? "default" : "pointer", fontSize: 13 }}>▲</button>
              <button type="button" onClick={() => move(b.id, 1)} disabled={i === sorted.length - 1}
                style={{ opacity: i === sorted.length - 1 ? 0.3 : 1, background: "none", border: "none", cursor: i === sorted.length - 1 ? "default" : "pointer", fontSize: 13 }}>▼</button>
            </div>

            <input value={b.label} onChange={(e) => update(b.id, { label: e.target.value })}
              placeholder="نص الزرار" style={{ ...inputStyle, width: 140 }} />
            <input value={b.href} onChange={(e) => update(b.id, { href: e.target.value })}
              placeholder="الرابط (مثال: /register)" style={{ ...inputStyle, flex: 1, minWidth: 160, direction: "ltr" }} />

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input type="checkbox" checked={b.visible} onChange={(e) => update(b.id, { visible: e.target.checked })} />
              <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12 }}>ظاهر</span>
            </label>

            <button type="button" onClick={() => remove(b.id)}
              style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontSize: 15 }}
              aria-label="حذف الزرار">✕</button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addButton}
        disabled={buttons.length >= 6}
        style={{
          marginTop: 12, padding: "8px 16px", borderRadius: 9,
          border: "1.5px dashed rgba(201,168,76,0.4)", background: "transparent",
          color: "#8B6914", fontFamily: "Cairo,sans-serif", fontSize: 12, fontWeight: 600,
          cursor: buttons.length >= 6 ? "default" : "pointer", opacity: buttons.length >= 6 ? 0.5 : 1,
        }}
      >
        + إضافة زرار {buttons.length >= 6 ? "(الحد الأقصى 6)" : ""}
      </button>
    </div>
  );
}
