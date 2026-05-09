import { BadRequestException } from "@nestjs/common";
import { Prisma, SOFStatus } from "@prisma/client";

import { MAX_SOF_PAGE_SIZE, SOF_STATUS_FLOW } from "../constants/sof.constants";

export function parseLimit(value: string | undefined, defaultValue: number): number {
  if (!value) {
    return defaultValue;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new BadRequestException("limit must be a positive integer");
  }

  return Math.min(parsed, MAX_SOF_PAGE_SIZE);
}

export function parseRequiredDate(value: string, fieldName: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${fieldName} must be a valid ISO date`);
  }

  return date;
}

export function parseOptionalDate(
  value: string | null | undefined,
  fieldName: string
): Date | null | undefined {
  if (value === null) {
    return null;
  }

  if (value === undefined || value === "") {
    return undefined;
  }

  return parseRequiredDate(value, fieldName);
}

/** Matches frontend `sofEventWindow`: minutes preferred; else hours; else chain from previous end. */
export type SofTimelineValidationRow = {
  id: string;
  eventTime: Date;
  durationHours: Prisma.Decimal | null | undefined;
  durationMinutes?: number | null;
};

const MS_PER_HOUR = 3_600_000;
/** Decimal hours → ms can drift slightly; allow up to one minute. */
const SOF_TIMELINE_TOLERANCE_MS = 60_000;

function positiveDurationHours(d: Prisma.Decimal | null | undefined): number | null {
  if (d === null || d === undefined) {
    return null;
  }
  const n = Number(d);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return n;
}

function positiveDurationMinutes(m: number | null | undefined): number | null {
  if (m === null || m === undefined) {
    return null;
  }
  if (!Number.isInteger(m) || m <= 0) {
    return null;
  }
  return m;
}

/** Length of the period ending at `eventTime`, in ms, when explicitly stored. */
export function sofEventDurationSpanMs(row: SofTimelineValidationRow): number | null {
  const dm = positiveDurationMinutes(row.durationMinutes ?? null);
  if (dm !== null) {
    return dm * 60_000;
  }
  const dh = positiveDurationHours(row.durationHours);
  if (dh !== null) {
    return dh * MS_PER_HOUR;
  }
  return null;
}

/**
 * Same geometry as the frontend `sofEventWindow`: explicit duration wins; otherwise the
 * period starts at the previous row's end time (chronological order).
 */
export function effectiveSofPeriodBoundsMs(
  row: SofTimelineValidationRow,
  previousRowEndMs: number | null
): { startMs: number; endMs: number } | null {
  const endMs = row.eventTime.getTime();
  const spanMs = sofEventDurationSpanMs(row);
  if (spanMs !== null && spanMs > 0) {
    return { startMs: endMs - spanMs, endMs };
  }
  if (previousRowEndMs !== null && endMs > previousRowEndMs) {
    return { startMs: previousRowEndMs, endMs };
  }
  return null;
}

export type SofSplitHostMatch = {
  hostId: string;
  hostStartMs: number;
  hostEndMs: number;
};

/**
 * When inserting [newStartMs, newEndMs], find the unique existing timeline row whose
 * effective period strictly contains that interval (matches UI “slice inside this block”).
 */
export function findTimelineSplitHost(
  timelineAsc: SofTimelineValidationRow[],
  newStartMs: number,
  newEndMs: number
): SofSplitHostMatch | null {
  let prevRowEndMs: number | null = null;
  const matches: SofSplitHostMatch[] = [];
  for (const r of timelineAsc) {
    const b = effectiveSofPeriodBoundsMs(r, prevRowEndMs);
    prevRowEndMs = r.eventTime.getTime();
    if (!b || b.endMs <= b.startMs) continue;
    const strictlyInside =
      b.startMs <= newStartMs &&
      newEndMs <= b.endMs &&
      (b.startMs < newStartMs || newEndMs < b.endMs);
    if (strictlyInside) {
      matches.push({ hostId: r.id, hostStartMs: b.startMs, hostEndMs: b.endMs });
    }
  }
  if (matches.length !== 1) return null;
  return matches[0]!;
}

/**
 * Block intersecting effective periods (explicit duration or chained), sorted by start.
 */
export function validateSofEventTimelineNoOverlap(rows: SofTimelineValidationRow[]): void {
  if (rows.length <= 1) {
    return;
  }

  const sorted = [...rows].sort(
    (a, b) => a.eventTime.getTime() - b.eventTime.getTime() || a.id.localeCompare(b.id)
  );

  type Window = { id: string; startMs: number; endMs: number };
  const windows: Window[] = [];
  let prevRowEndMs: number | null = null;
  for (const r of sorted) {
    const b = effectiveSofPeriodBoundsMs(r, prevRowEndMs);
    prevRowEndMs = r.eventTime.getTime();
    if (!b || b.endMs <= b.startMs) continue;
    windows.push({ id: r.id, startMs: b.startMs, endMs: b.endMs });
  }

  windows.sort((a, b) => a.startMs - b.startMs || a.id.localeCompare(b.id));

  for (let i = 1; i < windows.length; i++) {
    const prev = windows[i - 1];
    const curr = windows[i];
    if (prev.endMs - curr.startMs > SOF_TIMELINE_TOLERANCE_MS) {
      throw new BadRequestException(
        "SOF events cannot overlap: the event you are saving covers time that is already used by another event with a duration. Adjust the start/end times so the periods do not intersect."
      );
    }
  }
}

/**
 * @deprecated Kept as a thin alias so existing callers keep compiling. Prefer
 * `validateSofEventTimelineNoOverlap`, which permits out-of-order inserts.
 */
export const validateSofEventTimelineNoGaps = validateSofEventTimelineNoOverlap;

export function validateSofStatusTransition(currentStatus: SOFStatus, nextStatus: SOFStatus): void {
  if (currentStatus === nextStatus) {
    return;
  }

  if (!SOF_STATUS_FLOW[currentStatus].includes(nextStatus as never)) {
    throw new BadRequestException(`SOF status cannot move from ${currentStatus} to ${nextStatus}`);
  }
}
