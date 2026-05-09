"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSofEventTimelineNoGaps = void 0;
exports.parseLimit = parseLimit;
exports.parseRequiredDate = parseRequiredDate;
exports.parseOptionalDate = parseOptionalDate;
exports.sofEventDurationSpanMs = sofEventDurationSpanMs;
exports.effectiveSofPeriodBoundsMs = effectiveSofPeriodBoundsMs;
exports.findTimelineSplitHost = findTimelineSplitHost;
exports.validateSofEventTimelineNoOverlap = validateSofEventTimelineNoOverlap;
exports.validateSofStatusTransition = validateSofStatusTransition;
const common_1 = require("@nestjs/common");
const sof_constants_1 = require("../constants/sof.constants");
function parseLimit(value, defaultValue) {
    if (!value) {
        return defaultValue;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
        throw new common_1.BadRequestException("limit must be a positive integer");
    }
    return Math.min(parsed, sof_constants_1.MAX_SOF_PAGE_SIZE);
}
function parseRequiredDate(value, fieldName) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new common_1.BadRequestException(`${fieldName} must be a valid ISO date`);
    }
    return date;
}
function parseOptionalDate(value, fieldName) {
    if (value === null) {
        return null;
    }
    if (value === undefined || value === "") {
        return undefined;
    }
    return parseRequiredDate(value, fieldName);
}
const MS_PER_HOUR = 3_600_000;
const SOF_TIMELINE_TOLERANCE_MS = 60_000;
function positiveDurationHours(d) {
    if (d === null || d === undefined) {
        return null;
    }
    const n = Number(d);
    if (!Number.isFinite(n) || n <= 0) {
        return null;
    }
    return n;
}
function positiveDurationMinutes(m) {
    if (m === null || m === undefined) {
        return null;
    }
    if (!Number.isInteger(m) || m <= 0) {
        return null;
    }
    return m;
}
function sofEventDurationSpanMs(row) {
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
function effectiveSofPeriodBoundsMs(row, previousRowEndMs) {
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
function findTimelineSplitHost(timelineAsc, newStartMs, newEndMs) {
    let prevRowEndMs = null;
    const matches = [];
    for (const r of timelineAsc) {
        const b = effectiveSofPeriodBoundsMs(r, prevRowEndMs);
        prevRowEndMs = r.eventTime.getTime();
        if (!b || b.endMs <= b.startMs)
            continue;
        const strictlyInside = b.startMs <= newStartMs &&
            newEndMs <= b.endMs &&
            (b.startMs < newStartMs || newEndMs < b.endMs);
        if (strictlyInside) {
            matches.push({ hostId: r.id, hostStartMs: b.startMs, hostEndMs: b.endMs });
        }
    }
    if (matches.length !== 1)
        return null;
    return matches[0];
}
function validateSofEventTimelineNoOverlap(rows) {
    if (rows.length <= 1) {
        return;
    }
    const sorted = [...rows].sort((a, b) => a.eventTime.getTime() - b.eventTime.getTime() || a.id.localeCompare(b.id));
    const windows = [];
    let prevRowEndMs = null;
    for (const r of sorted) {
        const b = effectiveSofPeriodBoundsMs(r, prevRowEndMs);
        prevRowEndMs = r.eventTime.getTime();
        if (!b || b.endMs <= b.startMs)
            continue;
        windows.push({ id: r.id, startMs: b.startMs, endMs: b.endMs });
    }
    windows.sort((a, b) => a.startMs - b.startMs || a.id.localeCompare(b.id));
    for (let i = 1; i < windows.length; i++) {
        const prev = windows[i - 1];
        const curr = windows[i];
        if (prev.endMs - curr.startMs > SOF_TIMELINE_TOLERANCE_MS) {
            throw new common_1.BadRequestException("SOF events cannot overlap: the event you are saving covers time that is already used by another event with a duration. Adjust the start/end times so the periods do not intersect.");
        }
    }
}
exports.validateSofEventTimelineNoGaps = validateSofEventTimelineNoOverlap;
function validateSofStatusTransition(currentStatus, nextStatus) {
    if (currentStatus === nextStatus) {
        return;
    }
    if (!sof_constants_1.SOF_STATUS_FLOW[currentStatus].includes(nextStatus)) {
        throw new common_1.BadRequestException(`SOF status cannot move from ${currentStatus} to ${nextStatus}`);
    }
}
//# sourceMappingURL=sof.validator.js.map