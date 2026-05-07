/** Pure laytime segment rules shared by mother & lighter recalculation (testable). */

export function hoursBetweenNonNegative(a: Date, b: Date): number {
  return Math.max(0, (b.getTime() - a.getTime()) / 3_600_000);
}

export type LaytimeAccumEvent = {
  eventTime: Date;
  countsAsLaytime: boolean;
  laytimeImpactHours: number | null;
  /** Optional SofEvent id for timesheet / API mapping */
  closingEventId?: string | null;
};

export type LaytimeSegment = {
  periodFrom: Date;
  periodTo: Date;
  /** Wall-clock hours from periodFrom to periodTo */
  elapsedWallHours: number;
  /** Hours credited toward laytime (impact override or elapsed) */
  countingHours: number;
  countsAsLaytime: boolean;
  closingEventId: string | null;
  /** Running total of counting hours that count as used laytime after this segment */
  accumulatedUsedHours: number;
};

/**
 * Each segment ends at event i uses `laytimeImpactHours` if set and ≥ 0, else elapsed from previous anchor.
 * Credit to used vs excluded from `countsAsLaytime`.
 */
export function accumulateLaytimeSegmentsFromEvents(
  events: LaytimeAccumEvent[],
  commenceAt: Date
): { segments: LaytimeSegment[]; used: number; excluded: number } {
  const segments: LaytimeSegment[] = [];
  let used = 0;
  let excluded = 0;
  let tPrev = commenceAt;
  let accumulatedUsedHours = 0;

  for (const ev of events) {
    if (ev.eventTime.getTime() <= tPrev.getTime()) {
      tPrev = ev.eventTime;
      continue;
    }

    const impact = ev.laytimeImpactHours;
    const chunk =
      impact !== null && impact >= 0 ? impact : hoursBetweenNonNegative(tPrev, ev.eventTime);
    const elapsedWall = hoursBetweenNonNegative(tPrev, ev.eventTime);

    if (ev.countsAsLaytime) {
      used += chunk;
      accumulatedUsedHours += chunk;
    } else {
      excluded += chunk;
    }

    segments.push({
      periodFrom: new Date(tPrev),
      periodTo: new Date(ev.eventTime),
      elapsedWallHours: elapsedWall,
      countingHours: chunk,
      countsAsLaytime: ev.countsAsLaytime,
      closingEventId: ev.closingEventId ?? null,
      accumulatedUsedHours
    });

    tPrev = ev.eventTime;
  }

  return { segments, used, excluded };
}

export function accumulateLaytimeFromEvents(
  events: LaytimeAccumEvent[],
  commenceAt: Date
): { used: number; excluded: number } {
  const { used, excluded } = accumulateLaytimeSegmentsFromEvents(events, commenceAt);
  return { used, excluded };
}
