import { describe, expect, it } from "vitest";

import { isSofEventsCsvCommentLine, parseSofEventsCsv } from "./sof-events-csv-import";

describe("parseSofEventsCsv", () => {
  it("skips # comment lines", () => {
    expect(isSofEventsCsvCommentLine("# Allowed event types")).toBe(true);
    const { rows, errors } = parseSofEventsCsv(
      [
        "# comment",
        "event_starts_at,event_ends_at,event_type,laytime_count,remarks",
        "2026-05-10 08:00,2026-05-10 10:00,FOO,Count,"
      ].join("\n")
    );
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.durationMinutes).toBe(120);
  });
});
