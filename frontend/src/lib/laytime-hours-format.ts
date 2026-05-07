/**
 * Display laytime hours as whole hours + minutes (e.g. 1h 44min), not decimal hours.
 */
export function formatDecimalHoursToHMin(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  if (!Number.isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const totalMins = Math.round(abs * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0 && m === 0) return `${sign}0h 0min`;
  if (h === 0) return `${sign}${m}min`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}min`;
}

function parseFiniteHours(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** e.g. 316.8 → "316 hours 48 min" (all hours in the hour bucket, not rolled into days). */
export function formatDecimalHoursToTotalHoursMin(
  value: number | string | null | undefined
): string {
  const n = parseFiniteHours(value);
  if (n === null) return "—";
  const sign = n < 0 ? "-" : "";
  const totalMins = Math.round(Math.abs(n) * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0 && m === 0) return `${sign}0 hours 0 min`;
  const hp = `${h} hour${h === 1 ? "" : "s"}`;
  if (m === 0) return `${sign}${hp}`;
  return `${sign}${hp} ${m} min`;
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

/** `HH:mm` (24h) → "8:00 AM" for labels */
export function formatTime24To12Label(hhmm: string | null | undefined): string {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm.trim())) return "—";
  const [hs, ms] = hhmm.trim().split(":");
  let h = parseInt(hs, 10);
  const m = parseInt(ms, 10);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) return hhmm;
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ap}`;
}
