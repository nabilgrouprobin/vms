import { DateTime } from "luxon";

/** Calendar day for port-call / trip numbering (laytime default region). */
export const OPS_TIME_ZONE = "Asia/Dhaka";

export function dhakaDayBounds(now: DateTime = DateTime.now().setZone(OPS_TIME_ZONE)): {
  startUtc: Date;
  endExclusiveUtc: Date;
} {
  const start = now.setZone(OPS_TIME_ZONE).startOf("day");
  return {
    startUtc: start.toUTC().toJSDate(),
    endExclusiveUtc: start.plus({ days: 1 }).toUTC().toJSDate()
  };
}

export function formatOpsDateSegment(now: DateTime = DateTime.now().setZone(OPS_TIME_ZONE)): string {
  return now.setZone(OPS_TIME_ZONE).toFormat("yy-MM-dd");
}

export function padHullSegment(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(3, "0");
}

/** Port call: `YY-MM-DD-{hull}-{seq}` */
export function buildPortCallNo(dateSeg: string, hullCode: number, seq: number): string {
  return `${dateSeg}-${padHullSegment(hullCode)}-${padHullSegment(seq)}`;
}

/** Lighter trip: `YY-MM-DD-{motherHull}-{lighterHull}-{seq}` */
export function buildLighterTripNo(
  dateSeg: string,
  motherHullCode: number,
  lighterHullCode: number,
  seq: number
): string {
  return `${dateSeg}-${padHullSegment(motherHullCode)}-${padHullSegment(lighterHullCode)}-${padHullSegment(seq)}`;
}
