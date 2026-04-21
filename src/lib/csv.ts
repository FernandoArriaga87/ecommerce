// RFC-4180 CSV encoder. Excel-friendly (UTF-8 BOM + CRLF).
//
// Rules:
//   - Any cell containing a comma, quote, CR, or LF is wrapped in quotes,
//     with internal quotes doubled.
//   - null/undefined → empty string.
//   - Dates are ISO-8601; numbers/booleans coerce via String().

function escapeCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = v instanceof Date ? v.toISOString() : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const BOM = "﻿";
  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(","));
  }
  return BOM + lines.join("\r\n");
}

export function csvResponseHeaders(filename: string): HeadersInit {
  // Strip path separators and quotes from the filename to keep the header safe.
  const safe = filename.replace(/[\\/"\r\n]/g, "_");
  return {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${safe}"`,
    "Cache-Control": "no-store",
  };
}
