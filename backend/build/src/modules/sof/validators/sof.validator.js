"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLimit = parseLimit;
exports.parseRequiredDate = parseRequiredDate;
exports.parseOptionalDate = parseOptionalDate;
exports.sofEventDurationSpanMs = sofEventDurationSpanMs;
exports.validateSofEventTimelineNoGaps = validateSofEventTimelineNoGaps;
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
function validateSofEventTimelineNoGaps(rows) {
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
                throw new common_1.BadRequestException("SOF event times must be contiguous: when duration is set, the period start (event end minus duration) must equal the previous row end time. Record any intervening time as its own event or adjust duration so there is no gap (for example, a hold after a 3:00 end cannot use a 3:30 start with a half-hour duration to 4:00).");
            }
        }
        else if (currEnd + SOF_TIMELINE_TOLERANCE_MS < prevEnd) {
            throw new common_1.BadRequestException("SOF event times must be ordered: without duration, the event end cannot be before the previous row end time.");
        }
    }
}
function validateSofStatusTransition(currentStatus, nextStatus) {
    if (currentStatus === nextStatus) {
        return;
    }
    if (!sof_constants_1.SOF_STATUS_FLOW[currentStatus].includes(nextStatus)) {
        throw new common_1.BadRequestException(`SOF status cannot move from ${currentStatus} to ${nextStatus}`);
    }
}
//# sourceMappingURL=sof.validator.js.map