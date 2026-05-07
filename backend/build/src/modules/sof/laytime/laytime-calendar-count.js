"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_LAYTIME_ZONE = void 0;
exports.parseExcludedWeekdays = parseExcludedWeekdays;
exports.resolveLaytimeZone = resolveLaytimeZone;
exports.countableHoursOutsideExcludedWeekdays = countableHoursOutsideExcludedWeekdays;
exports.applyImportContractCalendarToMotherSegments = applyImportContractCalendarToMotherSegments;
const luxon_1 = require("luxon");
exports.DEFAULT_LAYTIME_ZONE = "Asia/Dhaka";
const DAY_NAMES = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6
};
function parseExcludedWeekdays(days) {
    const s = new Set();
    if (!days?.length)
        return s;
    for (const d of days) {
        const k = d.trim().toUpperCase();
        if (k in DAY_NAMES) {
            s.add(DAY_NAMES[k]);
        }
    }
    return s;
}
function resolveLaytimeZone(zone) {
    const z = (zone ?? "").trim() || exports.DEFAULT_LAYTIME_ZONE;
    const probe = luxon_1.DateTime.now().setZone(z);
    return probe.isValid ? z : exports.DEFAULT_LAYTIME_ZONE;
}
function countableHoursOutsideExcludedWeekdays(from, to, excluded, zone) {
    if (to.getTime() <= from.getTime())
        return 0;
    if (excluded.size === 0) {
        return Math.max(0, (to.getTime() - from.getTime()) / 3_600_000);
    }
    const z = resolveLaytimeZone(zone);
    let t = luxon_1.DateTime.fromJSDate(from, { zone: z });
    const end = luxon_1.DateTime.fromJSDate(to, { zone: z });
    if (!t.isValid || !end.isValid) {
        t = luxon_1.DateTime.fromJSDate(from, { zone: "utc" });
        const endUtc = luxon_1.DateTime.fromJSDate(to, { zone: "utc" });
        return sliceCountable(t, endUtc, excluded);
    }
    return sliceCountable(t, end, excluded);
}
function sliceCountable(t, end, excluded) {
    let ms = 0;
    let cur = t;
    while (cur < end) {
        const nextHour = cur.plus({ hours: 1 });
        const sliceEnd = nextHour > end ? end : nextHour;
        const luxWd = cur.weekday;
        const jsDay = luxWd === 7 ? 0 : luxWd;
        if (!excluded.has(jsDay)) {
            ms += sliceEnd.diff(cur, "milliseconds").milliseconds;
        }
        cur = nextHour;
    }
    return ms / 3_600_000;
}
function impactHoursNum(v) {
    if (v === null || v === undefined)
        return null;
    const n = Number(v.toString());
    return Number.isFinite(n) ? n : null;
}
function applyImportContractCalendarToMotherSegments(rawSegments, eventsById, contractExcludedDays, vesselLaytimeTimeZone) {
    const excludedSet = parseExcludedWeekdays(contractExcludedDays ?? []);
    const zone = resolveLaytimeZone(vesselLaytimeTimeZone);
    let used = 0;
    let excluded = 0;
    let accumulatedUsedHours = 0;
    const out = [];
    for (const seg of rawSegments) {
        const ev = seg.closingEventId ? eventsById.get(seg.closingEventId) : undefined;
        const impact = ev ? impactHoursNum(ev.laytimeImpactHours) : null;
        const explicitImpact = impact !== null && impact >= 0;
        if (!seg.countsAsLaytime) {
            excluded += seg.countingHours;
            out.push({
                ...seg,
                accumulatedUsedHours
            });
            continue;
        }
        if (explicitImpact || excludedSet.size === 0) {
            used += seg.countingHours;
            accumulatedUsedHours += seg.countingHours;
            out.push({
                ...seg,
                countingHours: seg.countingHours,
                accumulatedUsedHours
            });
            continue;
        }
        const countable = countableHoursOutsideExcludedWeekdays(seg.periodFrom, seg.periodTo, excludedSet, zone);
        const wall = seg.elapsedWallHours;
        const calendarStrip = Math.max(0, wall - countable);
        used += countable;
        excluded += calendarStrip;
        accumulatedUsedHours += countable;
        out.push({
            ...seg,
            countingHours: countable,
            accumulatedUsedHours
        });
    }
    return { segments: out, used, excluded };
}
//# sourceMappingURL=laytime-calendar-count.js.map