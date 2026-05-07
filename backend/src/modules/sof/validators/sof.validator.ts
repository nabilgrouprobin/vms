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

export function validateSofEventTimelineNoGaps(rows: SofTimelineValidationRow[]): void {
  if (rows.length <= 1) {
    return;
  }

  const sorted = [...rows].sort((a, b) => {
    const byTime = a.eventTime.getTime() - b.eventTime.getTime();
    if (byTime !== 0) {
      return byTime;
    }
    return a.id.localeCompare(b.id);
  });

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const prevEnd = prev.eventTime.getTime();
    const currEnd = curr.eventTime.getTime();
    const spanMs = sofEventDurationSpanMs(curr);

    if (spanMs !== null) {
      const currStart = currEnd - spanMs;
      if (Math.abs(currStart - prevEnd) > SOF_TIMELINE_TOLERANCE_MS) {
        throw new BadRequestException(
          "SOF event times must be contiguous: when duration is set, the period start (event end minus duration) must equal the previous row end time. Record any intervening time as its own event or adjust duration so there is no gap (for example, a hold after a 3:00 end cannot use a 3:30 start with a half-hour duration to 4:00)."
        );
      }
    } else if (currEnd + SOF_TIMELINE_TOLERANCE_MS < prevEnd) {
      throw new BadRequestException(
        "SOF event times must be ordered: without duration, the event end cannot be before the previous row end time."
      );
    }
  }
}

export function validateSofStatusTransition(currentStatus: SOFStatus, nextStatus: SOFStatus): void {
  if (currentStatus === nextStatus) {
    return;
  }

  if (!SOF_STATUS_FLOW[currentStatus].includes(nextStatus as never)) {
    throw new BadRequestException(`SOF status cannot move from ${currentStatus} to ${nextStatus}`);
  }
}
