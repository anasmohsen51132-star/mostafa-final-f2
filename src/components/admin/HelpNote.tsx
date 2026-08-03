// src/components/admin/HelpNote.tsx
//
// Small plain-language "how this screen works" note, placed under the page
// header on the screens the admin uses every day. Purely presentational —
// no state, no logic, no effect on data or behavior anywhere. Added to
// make the system friendlier for an admin who isn't very tech-savvy,
// without changing how anything actually works.
export function HelpNote({ text }: { text: string }) {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl mb-6"
      style={{
        padding: "12px 16px",
        background: "rgba(26,107,71,0.06)",
        border: "1px solid rgba(26,107,71,0.18)",
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>💡</span>
      <p
        style={{
          fontFamily: "Cairo,sans-serif",
          color: "#1A6B47",
          fontSize: 13.5,
          lineHeight: 1.8,
          margin: 0,
        }}
      >
        {text}
      </p>
    </div>
  );
}
