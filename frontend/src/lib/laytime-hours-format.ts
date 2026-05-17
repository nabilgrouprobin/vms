/** Coerce API / JSON values (number, string, Decimal) to a finite number. */
export function coerceFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const n = parseFloat(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Laytime table cells: e.g. 17.5 → "17 h 30 min" (never decimal hours). */
export function formatLaytimeDecimalHours(value: unknown): string {
  return formatLaytimeHoursAndMinutes(coerceFiniteNumber(value));
}

/** Display hours as "17 h 30 min" (signed when negative). */
export function formatLaytimeHoursAndMinutes(value: number | string | null | undefined): string {
  const n = parseFiniteHours(value);
  if (n === null) return "—";
  const sign = n < 0 ? "-" : "";
  const totalMins = Math.round(Math.abs(n) * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0 && m === 0) return `${sign}0 h 0 min`;
  if (m === 0) return `${sign}${h} h`;
  if (h === 0) return `${sign}${m} min`;
  return `${sign}${h} h ${m} min`;
}

/** Alias used across laytime panels — same as {@link formatLaytimeHoursAndMinutes}. */
export function formatDecimalHoursToHMin(value: number | string | null | undefined): string {
  return formatLaytimeHoursAndMinutes(value);
}

function parseFiniteHours(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** e.g. 316.8 → "316 h 48 min" */
export function formatDecimalHoursToTotalHoursMin(
  value: number | string | null | undefined
): string {
  return formatLaytimeHoursAndMinutes(value);
}

/** e.g. 316.8 → "13 days 4 hours 48 min" */
export function formatDecimalHoursToDaysHMin(value: number | string | null | undefined): string {
  const n = parseFiniteHours(value);
  if (n === null) return "—";
  const sign = n < 0 ? "-" : "";
  const totalMins = Math.round(Math.abs(n) * 60);
  const perDay = 24 * 60;
  const days = Math.floor(totalMins / perDay);
  const rem = totalMins % perDay;
  const h = Math.floor(rem / 60);
  const m = rem % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? "" : "s"}`);
  if (h > 0) parts.push(`${h} hour${h === 1 ? "" : "s"}`);
  if (m > 0) parts.push(`${m} min`);
  if (parts.length === 0) return `${sign}0 days 0 hours 0 min`;
  return `${sign}${parts.join(" ")}`;
}

