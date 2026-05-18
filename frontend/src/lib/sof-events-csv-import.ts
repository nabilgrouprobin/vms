import type { SofEventTypeOption } from "@/types/vms";

export type ParsedSofEventCsvRow = {
  eventEndsAt: string;
  eventStartsAt?: string;
  typeName: string;
  countsAsLaytime: boolean;
  remarks?: string;
  /** Set when start and end are both present — length in minutes. */
  durationMinutes?: number;
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function headerIndex(headers: string[], aliases: string[]): number {
  const norm = headers.map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  for (const a of aliases) {
    const i = norm.indexOf(a);
    if (i >= 0) return i;
  }
  return -1;
}

function parseLaytimeCount(raw: string | undefined): boolean {
  if (!raw?.trim()) return true;
  const v = raw.trim().toLowerCase();
  if (v === "not count" || v === "not_count" || v === "no" || v === "false" || v === "0") {
    return false;
  }
  return true;
}

/** Lines starting with # are documentation in the Format template. */
export function isSofEventsCsvCommentLine(line: string): boolean {
  return line.trim().startsWith("#");
}

function findDataHeaderLineIndex(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (isSofEventsCsvCommentLine(line) || !line.trim()) continue;
    const headers = parseCsvLine(line);
    const endIdx = headerIndex(headers, [
      "event_ends_at",
      "event_end",
      "event_ends",
      "end",
      "event_time"
    ]);
    const typeIdx = headerIndex(headers, ["event_type", "type", "type_name"]);
    if (endIdx >= 0 && typeIdx >= 0) return i;
  }
  return -1;
}

export function parseSofEventsCsv(text: string): {
  rows: ParsedSofEventCsvRow[];
  errors: string[];
} {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim());

  const errors: string[] = [];
  if (lines.length < 2) {
    return { rows: [], errors: ["CSV must include a header row and at least one data row."] };
  }

  const headerLineIdx = findDataHeaderLineIndex(lines);
  if (headerLineIdx < 0) {
    return {
      rows: [],
      errors: [
        'Missing header row with "event_ends_at" and "event_type". Download Format for a sample file.'
      ]
    };
  }

  const headers = parseCsvLine(lines[headerLineIdx]!);
  const endIdx = headerIndex(headers, [
    "event_ends_at",
    "event_end",
    "event_ends",
    "end",
    "event_time"
  ]);
  const startIdx = headerIndex(headers, [
    "event_starts_at",
    "event_start",
    "event_starts",
    "start"
  ]);
  const typeIdx = headerIndex(headers, ["event_type", "type", "type_name"]);
  const countIdx = headerIndex(headers, [
    "laytime_count",
    "count",
    "counts_as_laytime",
    "laytime"
  ]);
  const remarksIdx = headerIndex(headers, ["remarks", "remark"]);

  const rows: ParsedSofEventCsvRow[] = [];
  for (let li = headerLineIdx + 1; li < lines.length; li++) {
    const rawLine = lines[li]!;
    if (isSofEventsCsvCommentLine(rawLine) || !rawLine.trim()) continue;

    const cells = parseCsvLine(rawLine);
    const endsRaw = cells[endIdx]?.trim();
    const typeName = cells[typeIdx]?.trim();
    if (!endsRaw && !typeName) continue;
    if (!endsRaw) {
      errors.push(`Row ${li + 1}: missing end time.`);
      continue;
    }
    if (!typeName) {
      errors.push(`Row ${li + 1}: missing event type.`);
      continue;
    }
    const endMs = new Date(endsRaw).getTime();
    if (!Number.isFinite(endMs)) {
      errors.push(`Row ${li + 1}: invalid end time "${endsRaw}".`);
      continue;
    }

    let eventStartsAt: string | undefined;
    let durationMinutes: number | undefined;
    const startRaw = startIdx >= 0 ? cells[startIdx]?.trim() : "";
    if (startRaw) {
      const startMs = new Date(startRaw).getTime();
      if (!Number.isFinite(startMs)) {
        errors.push(`Row ${li + 1}: invalid start time.`);
        continue;
      }
      if (startMs >= endMs) {
        errors.push(`Row ${li + 1}: start must be before end.`);
        continue;
      }
      eventStartsAt = new Date(startMs).toISOString();
      durationMinutes = Math.max(1, Math.round((endMs - startMs) / 60_000));
    }

    rows.push({
      eventEndsAt: new Date(endMs).toISOString(),
      eventStartsAt,
      typeName,
      countsAsLaytime: parseLaytimeCount(countIdx >= 0 ? cells[countIdx] : undefined),
      remarks: remarksIdx >= 0 ? cells[remarksIdx]?.trim() || undefined : undefined,
      durationMinutes
    });
  }
  return { rows, errors };
}

export function resolveEventTypeByName(
  name: string,
  options: SofEventTypeOption[]
): SofEventTypeOption | null {
  const n = name.trim().toLowerCase();
  return (
    options.find((t) => t.name.trim().toLowerCase() === n) ??
    options.find((t) => t.code.trim().toLowerCase() === n) ??
    null
  );
}

/** Group import rows by whether `event_type` exists in master data. */
export function partitionSofEventRowsByKnownTypes(
  rows: ParsedSofEventCsvRow[],
  options: SofEventTypeOption[]
): {
  matched: { row: ParsedSofEventCsvRow; type: SofEventTypeOption }[];
  unknownTypeNames: string[];
} {
  const matched: { row: ParsedSofEventCsvRow; type: SofEventTypeOption }[] = [];
  const unknown = new Set<string>();
  for (const row of rows) {
    const type = resolveEventTypeByName(row.typeName, options);
    if (type) matched.push({ row, type });
    else unknown.add(row.typeName.trim());
  }
  return { matched, unknownTypeNames: [...unknown].sort() };
}
