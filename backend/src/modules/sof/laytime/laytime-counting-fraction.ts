import type { LaytimeSegment } from "./laytime-event-accumulation";

type LaytimeImpactCarrier = {
  laytimeImpactHours: { toString(): string } | null;
};

function impactHoursNum(v: LaytimeImpactCarrier["laytimeImpactHours"]): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v.toString());
  return Number.isFinite(n) ? n : null;
}

/**
 * Resolves CP counting fraction: explicit `laytimeCountingFraction` in (0,1] wins;
 * else `workableHatches / totalHatches` when both integers are set and total > 0 (capped at 1).
 */
export function resolveLaytimeCountingFractionFromContract(contract: {
  laytimeCountingFraction?: unknown;
  workableHatches?: unknown;
  totalHatches?: unknown;
}): number | null {
  const raw = contract.laytimeCountingFraction;
  if (raw !== null && raw !== undefined) {
    const s =
      typeof raw === "object" && raw !== null && "toString" in raw
        ? (raw as { toString(): string }).toString()
        : String(raw);
    const n = Number(s);
    if (Number.isFinite(n) && n > 0 && n <= 1) return n;
  }
  const wh = toOptionalNonNegInt(contract.workableHatches);
  const th = toOptionalPositiveInt(contract.totalHatches);
  if (wh !== null && th !== null && th > 0) {
    const r = wh / th;
    if (!Number.isFinite(r) || r <= 0) return null;
    return Math.min(1, r);
  }
  return null;
}

function toOptionalNonNegInt(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.trunc(n);
}

function toOptionalPositiveInt(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.trunc(n);
}

/**
 * Multiplies calendar-adjusted counting hours by the CP fraction when the closing event
 * does not use explicit `laytimeImpactHours` (those override charter mechanics).
 */
export function applyLaytimeCountingFractionToSegments(
  segments: LaytimeSegment[],
  fraction: number | null,
  eventsById: Map<string, LaytimeImpactCarrier>
): LaytimeSegment[] {
  if (fraction === null || !Number.isFinite(fraction) || fraction <= 0 || fraction > 1) {
    return segments.map((s) => ({ ...s }));
  }
  if (Math.abs(fraction - 1) < 1e-12) {
    return segments.map((s) => ({ ...s }));
  }

  let accumulatedUsedHours = 0;
  return segments.map((seg) => {
    const ev = seg.closingEventId ? eventsById.get(seg.closingEventId) : undefined;
    const impact = ev ? impactHoursNum(ev.laytimeImpactHours) : null;
    const explicitImpact = impact !== null && impact >= 0;

    if (!seg.countsAsLaytime) {
      return { ...seg, accumulatedUsedHours };
    }
    if (explicitImpact) {
      accumulatedUsedHours += seg.countingHours;
      return { ...seg, accumulatedUsedHours };
    }

    const ch = seg.countingHours * fraction;
    accumulatedUsedHours += ch;
    return { ...seg, countingHours: ch, accumulatedUsedHours };
  });
}
