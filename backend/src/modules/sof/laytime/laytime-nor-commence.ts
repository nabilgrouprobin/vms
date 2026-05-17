import { DateTime } from "luxon";

/**
 * Charter-style NOR clock (laytime zone):
 * - NOR strictly before 12:00 → commence same local calendar day at 13:00.
 * - NOR at or after 12:00 → commence next local calendar day at 08:00.
 *
 * When `manualCommence` is set, it wins and this rule is not applied.
 */
export function resolveCommenceFromNorTendered(
  norTenderedUtc: Date,
  laytimeIanaZone: string | null | undefined
): Date {
  const zone = (laytimeIanaZone ?? "").trim() || "Asia/Dhaka";
  const nor = DateTime.fromJSDate(norTenderedUtc, { zone: "utc" }).setZone(zone);
  if (!nor.isValid) {
    return norTenderedUtc;
  }
  const noon = nor.startOf("day").set({ hour: 12, minute: 0, second: 0, millisecond: 0 });
  if (nor < noon) {
    return nor
      .startOf("day")
      .set({ hour: 13, minute: 0, second: 0, millisecond: 0 })
      .toUTC()
      .toJSDate();
  }
  return nor
    .startOf("day")
    .plus({ days: 1 })
    .set({ hour: 8, minute: 0, second: 0, millisecond: 0 })
    .toUTC()
    .toJSDate();
}
