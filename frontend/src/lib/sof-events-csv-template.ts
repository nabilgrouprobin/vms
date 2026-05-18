import type { SofEventTypeOption } from "@/types/vms";

/** Canonical import columns — must match `parseSofEventsCsv` in sof-events-csv-import.ts */
export const SOF_EVENTS_IMPORT_CSV_HEADERS = [
  "event_starts_at",
  "event_ends_at",
  "event_type",
  "laytime_count",
  "remarks"
] as const;

export function escapeSofEventsCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Comment lines at top of the template (lines starting with # are ignored on import). */
export function buildSofEventsImportTemplateCommentLines(
  eventTypeOptions?: SofEventTypeOption[]
): string[] {
  const types = [...(eventTypeOptions ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  const lines = [
    "# SOF events import template",
    "#",
    "# How to use: fill rows below, save as CSV, then use Import on the Events page.",
    "# Lines starting with # are ignored when importing.",
    "#",
    "# Columns:",
    "#   event_starts_at — when the period starts (YYYY-MM-DD HH:mm)",
    "#   event_ends_at   — when the period ends (required)",
    "#   event_type      — must match a name or code listed below exactly",
    "#   laytime_count   — Count or Not count (optional, default Count)",
    "#   remarks         — optional notes",
    "#",
    "# Length: calculated automatically from start to end (do not enter duration).",
    "#",
    "# Unknown event_type: that row is skipped; other rows still import. Fix the name",
    "# or add the type under Master data → SOF event types, then re-import.",
    "#",
    "# Allowed event types for this SOF:"
  ];

  if (types.length === 0) {
    lines.push("#   (none loaded — open Events while online, or add types in Master data)");
  } else {
    for (const t of types) {
      lines.push(`#   ${t.name} (code: ${t.code})`);
    }
  }

  lines.push("#", "# --- data rows below (delete example rows or edit them) ---");
  return lines;
}

function pickSampleEventTypes(options: SofEventTypeOption[] | undefined): {
  nor: string;
  work: string;
  hold: string;
} {
  const list = options ?? [];
  const byName = (pred: (n: string) => boolean) =>
    list.find((t) => pred(t.name.toLowerCase()))?.name;

  return {
    nor:
      byName((n) => n.includes("nor")) ??
      list[0]?.name ??
      "NOR TENDERED",
    work:
      byName((n) => n.includes("discharg") || n.includes("work")) ??
      list[1]?.name ??
      "DISCHARGING CONTINUE",
    hold:
      byName((n) => n.includes("weather") || n.includes("hold") || n.includes("delay")) ??
      list[2]?.name ??
      "BAD WEATHER ISSUE"
  };
}

/**
 * Sample CSV for collecting SOF events offline. Fill rows and use Import on the Events page.
 * Times accept ISO or `YYYY-MM-DD HH:mm`.
 */
export function buildSofEventsImportTemplateCsv(
  eventTypeOptions?: SofEventTypeOption[]
): string {
  const { nor, work, hold } = pickSampleEventTypes(eventTypeOptions);

  const dataRows: string[][] = [
    [
      "2026-05-10 08:00",
      "2026-05-10 10:00",
      nor,
      "Count",
      "Example — edit dates and type (use names from list above)"
    ],
    [
      "2026-05-10 10:00",
      "2026-05-10 22:30",
      work,
      "Count",
      "Example — length = end minus start (automatic)"
    ],
    [
      "2026-05-11 06:00",
      "2026-05-11 09:00",
      hold,
      "Not count",
      "Example — Not count (still in contact window)"
    ]
  ];

  const lines = [
    ...buildSofEventsImportTemplateCommentLines(eventTypeOptions),
    SOF_EVENTS_IMPORT_CSV_HEADERS.join(","),
    ...dataRows.map((row) => row.map((c) => escapeSofEventsCsvCell(c)).join(","))
  ];
  return lines.join("\r\n");
}

export function downloadSofEventsImportTemplateCsv(options?: {
  filename?: string;
  eventTypeOptions?: SofEventTypeOption[];
}): void {
  const csv = `\uFEFF${buildSofEventsImportTemplateCsv(options?.eventTypeOptions)}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = options?.filename ?? "sof-events-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}
