// src/lib/exports/csv.ts
//
// Section 9 (Exports) — CSV support. Deliberately no new dependency: CSV
// is simple enough to build correctly by hand, and this stays consistent
// across every export endpoint (incidents, AI reports, security, health).
function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Quote any cell containing a comma, quote, or newline; escape quotes by
  // doubling them, per RFC 4180.
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function buildCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const row of rows) lines.push(row.map(escapeCsvCell).join(","));
  // UTF-8 BOM so Excel opens Arabic text correctly instead of mangling it.
  return "\uFEFF" + lines.join("\r\n");
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
