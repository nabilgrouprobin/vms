import { describe, expect, it } from "vitest";

import {
  SOF_EVENTS_IMPORT_CSV_HEADERS,
  buildSofEventsImportTemplateCsv
} from "./sof-events-csv-template";
import {
  parseSofEventsCsv,
  partitionSofEventRowsByKnownTypes
} from "./sof-events-csv-import";

const sampleTypes = [
  {
    id: "1",
    code: "NOR",
    name: "NOR TENDERED",
    scope: "MOTHER_VESSEL",
    category: "NORMAL" as const
  },
  {
    id: "2",
    code: "DIS",
    name: "DISCHARGING CONTINUE",
    scope: "MOTHER_VESSEL",
    category: "NORMAL" as const
  }
];

describe("sof-events-csv-template", () => {
  it("lists event types in comments and omits duration column", () => {
    const csv = buildSofEventsImportTemplateCsv(sampleTypes);
    expect(csv).toContain("# Allowed event types");
    expect(csv).toContain("NOR TENDERED (code: NOR)");
    expect(csv).toContain("DISCHARGING CONTINUE (code: DIS)");
    expect(csv).not.toContain("duration_minutes");
    expect(csv).toContain(SOF_EVENTS_IMPORT_CSV_HEADERS.join(","));
  });

  it("parses template with comment header block", () => {
    const csv = buildSofEventsImportTemplateCsv(sampleTypes);
    const { rows, errors } = parseSofEventsCsv(csv.replace(/^\uFEFF/, ""));
    expect(errors).toEqual([]);
    expect(rows.length).toBe(3);
    expect(rows.every((r) => r.durationMinutes != null && r.durationMinutes > 0)).toBe(true);
  });

  it("partitions unknown event types", () => {
    const { rows } = parseSofEventsCsv(
      [
        "event_starts_at,event_ends_at,event_type,laytime_count,remarks",
        "2026-05-10 08:00,2026-05-10 10:00,NOR TENDERED,Count,",
        "2026-05-10 10:00,2026-05-10 12:00,NOT IN DATABASE,Count,"
      ].join("\n")
    );
    const { matched, unknownTypeNames } = partitionSofEventRowsByKnownTypes(rows, sampleTypes);
    expect(matched).toHaveLength(1);
    expect(unknownTypeNames).toEqual(["NOT IN DATABASE"]);
  });
});
