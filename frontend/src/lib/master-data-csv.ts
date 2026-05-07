/** Minimal CSV read/write (quoted fields with doubled quotes). */

export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function stringifyCsv(headers: string[], rows: string[][]): string {
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}

export function downloadCsvFile(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function unquoteCsvCell(raw: string): string {
  const t = raw.trim();
  if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
    return t.slice(1, -1).replace(/""/g, '"');
  }
  return t;
}

/** Parse one CSV line respecting double quotes. */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
        cur += c;
      }
    } else if (c === "," && !inQuotes) {
      out.push(unquoteCsvCell(cur));
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(unquoteCsvCell(cur));
  return out;
}

/** Split CSV into physical lines, respecting newlines inside quoted fields. */
export function splitCsvRecords(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines: string[] = [];
  let row = "";
  let inQuotes = false;
  for (let i = 0; i < normalized.length; i += 1) {
    const c = normalized[i];
    if (c === '"') {
      if (inQuotes && normalized[i + 1] === '"') {
        row += '""';
        i += 1;
      } else {
        inQuotes = !inQuotes;
        row += '"';
      }
    } else if (c === "\n" && !inQuotes) {
      if (row.trim().length) {
        lines.push(row);
      }
      row = "";
    } else {
      row += c;
    }
  }
  if (row.trim().length) {
    lines.push(row);
  }
  return lines;
}

export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = splitCsvRecords(text);
  if (!lines.length) {
    return { headers: [], rows: [] };
  }
  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: string[][] = [];
  for (let li = 1; li < lines.length; li += 1) {
    const cells = parseCsvLine(lines[li]);
    if (cells.every((c) => c === "")) continue;
    rows.push(cells);
  }
  return { headers, rows };
}

export function rowsToRecords(headers: string[], rows: string[][]): Record<string, string>[] {
  return rows.map((cells) => {
    const rec: Record<string, string> = {};
    headers.forEach((h, i) => {
      rec[h] = cells[i] ?? "";
    });
    return rec;
  });
}

export function parseBool(raw: string | undefined): boolean | undefined {
  if (raw === undefined || raw === null) return undefined;
  const v = raw.trim().toLowerCase();
  if (v === "" || v === "null") return undefined;
  if (["1", "true", "yes", "y", "active"].includes(v)) return true;
  if (["0", "false", "no", "n", "inactive"].includes(v)) return false;
  return undefined;
}

export function parseOptionalNumber(raw: string | undefined): number | null | undefined {
  if (raw === undefined) return undefined;
  const t = raw.trim();
  if (t === "" || t.toLowerCase() === "null") return null;
  const n = parseFloat(t);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

export function parseOptionalInt(raw: string | undefined): number | null | undefined {
  if (raw === undefined) return undefined;
  const t = raw.trim();
  if (t === "" || t.toLowerCase() === "null") return null;
  const n = parseInt(t, 10);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

export async function fetchAllPages<T>(options: {
  fetchPage: (cursor: string | undefined) => Promise<{ data: T[]; nextCursor: string | null }>;
}): Promise<T[]> {
  const out: T[] = [];
  let cursor: string | undefined;
  for (;;) {
    const page = await options.fetchPage(cursor);
    out.push(...page.data);
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return out;
}
