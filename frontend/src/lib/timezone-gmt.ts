/**
 * IANA zone helpers for laytime / vessel-call UI. Offsets are for `when` (default: now) and can
 * change with DST where applicable.
 */

/** When a vessel call has no laytime zone saved, UI and copy use this IANA id. */
export const DEFAULT_LAYTIME_IANA_ZONE = "Asia/Dhaka";

/** Common zones for charter / discharge ops (IANA ids; values saved to API). */
export const LAYTIME_TIMEZONE_SUGGESTIONS: readonly string[] = [
  "UTC",
  DEFAULT_LAYTIME_IANA_ZONE,
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Dubai",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Amsterdam",
  "America/New_York"
] as const;

/** GMT-style offset label for today in `iana`, e.g. `GMT+6`, `GMT+5:30`, or null if invalid. */
export function formatGmtOffsetForZone(iana: string, when: Date = new Date()): string | null {
  const t = iana.trim();
  if (!t) return null;
  try {
    const dtf = new Intl.DateTimeFormat("en-GB", {
      timeZone: t,
      timeZoneName: "shortOffset"
    });
    const parts = dtf.formatToParts(when);
    const raw = parts.find((p) => p.type === "timeZoneName")?.value?.trim();
    if (!raw) return null;
    return raw.replace(/^UTC/i, "GMT");
  } catch {
    return null;
  }
}

/** One-line hint for datalist / labels, e.g. `Asia/Dhaka — GMT+6` when `iana` is the default zone. */
export function formatIanaZoneSuggestionLabel(iana: string, when?: Date): string {
  const gmt = formatGmtOffsetForZone(iana, when);
  return gmt ? `${iana} — ${gmt}` : iana;
}
