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
  /**
   * Persisted DB id, or `null` for the *prospective* row currently being
   * validated. Null ids sort last when two rows share an `eventTime`, which
   * matches "the new event slots in after existing same-instant rows".
   */
  id: string | null;
  eventTime: Date;
  durationHours: Prisma.Decimal | null | undefined;
  durationMinutes?: number | null;
  /** Optional display label so overlap errors can name the conflicting event. */
  remarks?: string | null;
  /** Optional event type display name (e.g. "BAD WEATHER ISSUE"). */
  eventTypeDefinition?: { name: string } | null;
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

/**
 * Tie-breaker for two timeline rows with the same `eventTime`. A `null` id
 * (the prospective new row) always sorts last so existing persisted rows
 * keep their relative order.
 */
function compareTimelineId(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a.localeCompare(b);
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
    if (strictlyInside && r.id !== null) {
      matches.push({ hostId: r.id, hostStartMs: b.startMs, hostEndMs: b.endMs });
    }
  }
  if (matches.length !== 1) return null;
  return matches[0]!;
}

/** Format an instant using the local server zone in the form `YYYY-MM-DD HH:mm`. */
function formatTimelineInstant(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/** Format a window as `YYYY-MM-DD HH:mm → YYYY-MM-DD HH:mm`. */
function formatTimelineWindow(startMs: number, endMs: number): string {
  return `${formatTimelineInstant(startMs)} → ${formatTimelineInstant(endMs)}`;
}

/** Build a short label for a conflicting row: type name + truncated remarks. */
function describeConflictRow(row: SofTimelineValidationRow): string {
  const parts: string[] = [];
  const typeName = row.eventTypeDefinition?.name?.trim();
  if (typeName) parts.push(typeName);
  const remarks = row.remarks?.trim();
  if (remarks) {
    const oneLine = remarks.replace(/\s+/g, " ");
    parts.push(`"${oneLine.length > 60 ? `${oneLine.slice(0, 57)}…` : oneLine}"`);
  }
  return parts.length > 0 ? parts.join(" — ") : "(no remarks)";
}

/**
 * Block intersecting effective periods (explicit duration or chained), sorted by start.
 *
 * On conflict, the thrown `BadRequestException` includes the *new* event's
 * intended window and *every* existing event it collides with (with type and
 * remarks), so the user can quickly see what to adjust instead of scanning
 * the timeline by hand.
 */
export function validateSofEventTimelineNoOverlap(rows: SofTimelineValidationRow[]): void {
  if (rows.length <= 1) {
    return;
  }

  const sorted = [...rows].sort(
    (a, b) => a.eventTime.getTime() - b.eventTime.getTime() || compareTimelineId(a.id, b.id)
  );

  type Window = { row: SofTimelineValidationRow; startMs: number; endMs: number };
  const windows: Window[] = [];
  let prevRowEndMs: number | null = null;
  for (const r of sorted) {
    const b = effectiveSofPeriodBoundsMs(r, prevRowEndMs);
    prevRowEndMs = r.eventTime.getTime();
    if (!b || b.endMs <= b.startMs) continue;
    windows.push({ row: r, startMs: b.startMs, endMs: b.endMs });
  }

  windows.sort(
    (a, b) => a.startMs - b.startMs || compareTimelineId(a.row.id, b.row.id)
  );

  // First locate the prospective new row's effective window. If the caller
  // didn't tag any row with id=null we still report a conflict using the
  // first detected pair (existing-vs-existing inconsistency).
  const newWindow = windows.find((w) => w.row.id === null);

  if (newWindow) {
    const conflicts = windows.filter((w) => {
      if (w === newWindow) return false;
      const overlapStart = Math.max(w.startMs, newWindow.startMs);
      const overlapEnd = Math.min(w.endMs, newWindow.endMs);
      return overlapEnd - overlapStart > SOF_TIMELINE_TOLERANCE_MS;
    });
    if (conflicts.length === 0) return;

    const newRange = formatTimelineWindow(newWindow.startMs, newWindow.endMs);
    const lines = conflicts.map((c) => {
      const overlapStart = Math.max(c.startMs, newWindow.startMs);
      const overlapEnd = Math.min(c.endMs, newWindow.endMs);
      const overlapMinutes = Math.max(0, Math.round((overlapEnd - overlapStart) / 60_000));
      return (
        `  - ${formatTimelineWindow(c.startMs, c.endMs)} (${overlapMinutes} min overlap) — ` +
        describeConflictRow(c.row)
      );
    });
    throw new BadRequestException(
      `SOF events cannot overlap. The event you are saving covers ${newRange} ` +
        `and conflicts with ${conflicts.length} existing event(s):\n${lines.join("\n")}\n` +
        "Adjust the start/end times so the periods do not intersect, or delete/edit the existing event(s) first."
    );
  }

  // Fallback: no prospective row was tagged. Report the first existing pair
  // that intersects so we never silently accept an inconsistent timeline.
  for (let i = 1; i < windows.length; i++) {
    const prev = windows[i - 1];
    const curr = windows[i];
    if (prev.endMs - curr.startMs > SOF_TIMELINE_TOLERANCE_MS) {
      const overlapStart = Math.max(prev.startMs, curr.startMs);
      const overlapEnd = Math.min(prev.endMs, curr.endMs);
      const overlapMinutes = Math.max(0, Math.round((overlapEnd - overlapStart) / 60_000));
      throw new BadRequestException(
        `SOF events cannot overlap. ${formatTimelineWindow(curr.startMs, curr.endMs)} ` +
          `(${describeConflictRow(curr.row)}) intersects ` +
          `${formatTimelineWindow(prev.startMs, prev.endMs)} ` +
          `(${describeConflictRow(prev.row)}) by ${overlapMinutes} min. ` +
          "Adjust the start/end times so the periods do not intersect, or delete/edit one of the events."
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
