"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_LAYTIME_PORT_TZ = void 0;
exports.unloadQtyMt = unloadQtyMt;
exports.balanceQtyMt = balanceQtyMt;
exports.loadedQtyMt = loadedQtyMt;
exports.isEngagedTrip = isEngagedTrip;
exports.isReleasedTrip = isReleasedTrip;
exports.exclusivePipelineBucket = exclusivePipelineBucket;
exports.ymdInTimeZone = ymdInTimeZone;
exports.resolvePortTimeZone = resolvePortTimeZone;
exports.addCalendarDaysToYmd = addCalendarDaysToYmd;
exports.zonedDayStartEndUtc = zonedDayStartEndUtc;
exports.portYesterdayRange = portYesterdayRange;
exports.portLastFiveCalendarDaysRange = portLastFiveCalendarDaysRange;
exports.allocationInstant = allocationInstant;
exports.isLastNightPortAllocation = isLastNightPortAllocation;
exports.remVoyageMt = remVoyageMt;
exports.remAtGhatMt = remAtGhatMt;
exports.aggregateBoardMetrics = aggregateBoardMetrics;
exports.DEFAULT_LAYTIME_PORT_TZ = "Asia/Dhaka";
const TERMINAL_DONE = new Set(["UNLOADED", "CLOSED", "CANCELLED"]);
const GHAT_DISCHARGING = new Set(["UNLOADING", "ON_HOLD", "PARTIAL_UNLOADED"]);
const GHAT_STANDING = new Set(["ARRIVED_GHAT", "WAITING_UNLOAD"]);
const VOYAGE_GHAT = new Set(["RETURNING_AT_SEA"]);
const LOAD_DONE = new Set([
    "LOADED",
    "DRAFT_SURVEY_STAGING",
    "DRAFT_SURVEY_IN_PROGRESS",
    "DRAFT_SURVEY_COMPLETED"
]);
const LOADING = new Set(["LOADING"]);
const ALONGSIDE = new Set(["ALONGSIDE", "PREPARING_TO_LOAD"]);
function decN(v) {
    if (v == null)
        return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}
function unloadQtyMt(t) {
    const a = decN(t.lighterAssignment?.actualDischargedQtyMt ?? undefined);
    if (a != null)
        return a;
    let s = 0;
    let any = false;
    for (const c of t.cargoes ?? []) {
        const q = decN(c.dischargedQtyTon ?? undefined);
        if (q != null) {
            s += q;
            any = true;
        }
    }
    return any ? s : null;
}
function balanceQtyMt(t) {
    const est = decN(t.lighterAssignment?.estimatedQtyMt);
    const u = unloadQtyMt(t);
    if (est == null)
        return null;
    if (u == null)
        return est;
    return Math.max(0, est - u);
}
function loadedQtyMt(t) {
    let s = 0;
    let any = false;
    for (const c of t.cargoes ?? []) {
        const q = decN(c.loadedQtyTon ?? undefined);
        if (q != null) {
            s += q;
            any = true;
        }
    }
    if (any)
        return s;
    return decN(t.lighterAssignment?.estimatedQtyMt);
}
function isEngagedTrip(status) {
    if (TERMINAL_DONE.has(status))
        return false;
    if (status === "PLANNED")
        return false;
    return true;
}
function isReleasedTrip(status) {
    return status === "UNLOADED" || status === "CLOSED";
}
function exclusivePipelineBucket(t) {
    if (!isEngagedTrip(t.status))
        return null;
    if (GHAT_DISCHARGING.has(t.status))
        return "ghatDischarging";
    if (GHAT_STANDING.has(t.status))
        return "ghatStanding";
    if (VOYAGE_GHAT.has(t.status) ||
        (t.departedMvDate != null && t.arrivedGhatDate == null && !GHAT_STANDING.has(t.status))) {
        return "voyageGhat";
    }
    if (LOAD_DONE.has(t.status))
        return "loadDone";
    if (LOADING.has(t.status))
        return "loading";
    if (ALONGSIDE.has(t.status))
        return "alongside";
    return "toMv";
}
function compareYmd(a, b) {
    if (a < b)
        return -1;
    if (a > b)
        return 1;
    return 0;
}
function ymdInTimeZone(instant, timeZone) {
    return instant.toLocaleDateString("en-CA", { timeZone });
}
function resolvePortTimeZone(laytimeTimeZone) {
    const t = laytimeTimeZone?.trim();
    const base = t && t.length > 0 ? t : exports.DEFAULT_LAYTIME_PORT_TZ;
    try {
        new Intl.DateTimeFormat("en-CA", { timeZone: base }).format(new Date());
        return base;
    }
    catch {
        return exports.DEFAULT_LAYTIME_PORT_TZ;
    }
}
function addCalendarDaysToYmd(ymd, deltaDays) {
    const [y, m, d] = ymd.split("-").map((x) => parseInt(x, 10));
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + deltaDays);
    return dt.toISOString().slice(0, 10);
}
function zonedDayStartUtcForYmd(ymd, tz) {
    const [y, mo, da] = ymd.split("-").map((x) => parseInt(x, 10));
    const noon = Date.UTC(y, mo - 1, da, 12, 0, 0);
    let lo = noon - 50 * 3600 * 1000;
    let hi = noon + 50 * 3600 * 1000;
    const ymdAt = (ms) => ymdInTimeZone(new Date(ms), tz);
    while (compareYmd(ymdAt(lo), ymd) >= 0)
        lo -= 24 * 3600 * 1000;
    while (compareYmd(ymdAt(hi), ymd) < 0)
        hi += 24 * 3600 * 1000;
    while (lo < hi - 1) {
        const mid = Math.floor((lo + hi) / 2);
        if (compareYmd(ymdAt(mid), ymd) < 0)
            lo = mid;
        else
            hi = mid;
    }
    let dayStart = hi;
    while (dayStart > 0 && ymdAt(dayStart - 1) === ymd)
        dayStart -= 1;
    return new Date(dayStart);
}
function zonedDayStartEndUtc(ymd, laytimeTimeZone) {
    const tz = resolvePortTimeZone(laytimeTimeZone);
    const start = zonedDayStartUtcForYmd(ymd, tz);
    const end = zonedDayStartUtcForYmd(addCalendarDaysToYmd(ymd, 1), tz);
    return { start, end };
}
function portYesterdayRange(now, laytimeTimeZone) {
    const tz = resolvePortTimeZone(laytimeTimeZone);
    const todayYmd = ymdInTimeZone(now, tz);
    const yesterdayYmd = addCalendarDaysToYmd(todayYmd, -1);
    const start = zonedDayStartUtcForYmd(yesterdayYmd, tz);
    const end = zonedDayStartUtcForYmd(todayYmd, tz);
    return { start, end };
}
function portLastFiveCalendarDaysRange(now, laytimeTimeZone) {
    const tz = resolvePortTimeZone(laytimeTimeZone);
    const todayYmd = ymdInTimeZone(now, tz);
    const oldestYmd = addCalendarDaysToYmd(todayYmd, -4);
    const start = zonedDayStartUtcForYmd(oldestYmd, tz);
    const end = zonedDayStartUtcForYmd(addCalendarDaysToYmd(todayYmd, 1), tz);
    return { start, end };
}
function allocationInstant(t) {
    return t.lighterAssignment?.assignedDate ?? t.assignedAt;
}
function isLastNightPortAllocation(t, range) {
    const a = allocationInstant(t);
    return a >= range.start && a < range.end;
}
function remVoyageMt(t) {
    if (!t.departedMvDate || t.unloadCompletedAt)
        return null;
    if (TERMINAL_DONE.has(t.status))
        return null;
    const loaded = loadedQtyMt(t);
    const u = unloadQtyMt(t) ?? 0;
    if (loaded != null)
        return Math.max(0, loaded - u);
    return balanceQtyMt(t);
}
function remAtGhatMt(t) {
    if (!GHAT_STANDING.has(t.status) && !GHAT_DISCHARGING.has(t.status))
        return null;
    return balanceQtyMt(t);
}
function emptyPipeline() {
    return {
        toMv: 0,
        alongside: 0,
        loading: 0,
        loadDone: 0,
        voyageGhat: 0,
        ghatStanding: 0,
        ghatDischarging: 0
    };
}
function aggregateBoardMetrics(trips, totalAssignments, now, laytimeTimeZone) {
    const lastNightPort = portYesterdayRange(now, laytimeTimeZone);
    const lighter5dWindow = portLastFiveCalendarDaysRange(now, laytimeTimeZone);
    const pipeline = emptyPipeline();
    let lastNightAllocated = 0;
    let released = 0;
    let engaged = 0;
    let remVoyageSum = 0;
    let remVoyageAny = false;
    let remGhatSum = 0;
    let remGhatAny = false;
    let lvDischargeSum = 0;
    let lvDischargeAny = false;
    let lighter5dSum = 0;
    for (const t of trips) {
        const uq = unloadQtyMt(t);
        if (isReleasedTrip(t.status))
            released += 1;
        if (isEngagedTrip(t.status))
            engaged += 1;
        if (isLastNightPortAllocation(t, lastNightPort))
            lastNightAllocated += 1;
        const bucket = exclusivePipelineBucket(t);
        if (bucket)
            pipeline[bucket] += 1;
        const rvm = remVoyageMt(t);
        if (rvm != null) {
            remVoyageSum += rvm;
            remVoyageAny = true;
        }
        const ram = remAtGhatMt(t);
        if (ram != null) {
            remGhatSum += ram;
            remGhatAny = true;
        }
        if (uq != null) {
            lvDischargeSum += uq;
            lvDischargeAny = true;
        }
        if (t.unloadCompletedAt &&
            t.unloadCompletedAt >= lighter5dWindow.start &&
            t.unloadCompletedAt < lighter5dWindow.end &&
            uq != null) {
            lighter5dSum += uq;
        }
    }
    return {
        totalTrips: trips.length,
        totalAssignments,
        lastNightAllocated,
        released,
        engaged,
        pipeline,
        remVoyageMt: remVoyageAny ? remVoyageSum : null,
        remGhatMt: remGhatAny ? remGhatSum : null,
        dischargedFromLvMt: lvDischargeAny ? lvDischargeSum : null,
        lighterDischargeLast5DayAvgMt: lighter5dSum > 0 ? lighter5dSum / 5 : null
    };
}
//# sourceMappingURL=lighter-trip-board-metrics.js.map