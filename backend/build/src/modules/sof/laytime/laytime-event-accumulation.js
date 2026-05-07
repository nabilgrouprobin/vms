"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hoursBetweenNonNegative = hoursBetweenNonNegative;
exports.accumulateLaytimeSegmentsFromEvents = accumulateLaytimeSegmentsFromEvents;
exports.accumulateLaytimeFromEvents = accumulateLaytimeFromEvents;
function hoursBetweenNonNegative(a, b) {
    return Math.max(0, (b.getTime() - a.getTime()) / 3_600_000);
}
function accumulateLaytimeSegmentsFromEvents(events, commenceAt) {
    const segments = [];
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
        const chunk = impact !== null && impact >= 0 ? impact : hoursBetweenNonNegative(tPrev, ev.eventTime);
        const elapsedWall = hoursBetweenNonNegative(tPrev, ev.eventTime);
        if (ev.countsAsLaytime) {
            used += chunk;
            accumulatedUsedHours += chunk;
        }
        else {
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
function accumulateLaytimeFromEvents(events, commenceAt) {
    const { used, excluded } = accumulateLaytimeSegmentsFromEvents(events, commenceAt);
    return { used, excluded };
}
//# sourceMappingURL=laytime-event-accumulation.js.map