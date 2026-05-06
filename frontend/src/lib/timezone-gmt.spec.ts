import { describe, expect, it } from "vitest";

import {
  DEFAULT_LAYTIME_IANA_ZONE,
  formatGmtOffsetForZone,
  LAYTIME_TIMEZONE_SUGGESTIONS
} from "./timezone-gmt";

describe("formatGmtOffsetForZone", () => {
  const fixed = new Date("2024-06-15T12:00:00.000Z");

  it("returns GMT for UTC", () => {
    const g = formatGmtOffsetForZone("UTC", fixed);
    expect(g).toMatch(/GMT\+?0|^GMT$/i);
  });

  it(`returns offset for ${DEFAULT_LAYTIME_IANA_ZONE} (no DST)`, () => {
    const g = formatGmtOffsetForZone(DEFAULT_LAYTIME_IANA_ZONE, fixed);
    expect(g).toMatch(/GMT\+6/);
  });

  it("returns null for invalid zone", () => {
    expect(formatGmtOffsetForZone("Not/AZone")).toBeNull();
  });
});

describe("LAYTIME_TIMEZONE_SUGGESTIONS", () => {
  it("lists common IANA ids", () => {
    expect(LAYTIME_TIMEZONE_SUGGESTIONS).toContain(DEFAULT_LAYTIME_IANA_ZONE);
    expect(LAYTIME_TIMEZONE_SUGGESTIONS).toContain("UTC");
  });
});
