"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseContractWeekWindow = parseContractWeekWindow;
exports.formatContractWeekWindowLabel = formatContractWeekWindowLabel;
exports.contactHoursInRange = contactHoursInRange;
exports.buildMotherLaytimeDailyLedger = buildMotherLaytimeDailyLedger;
const luxon_1 = require("luxon");
const WEEK_MARKER = /^__LAYTIME_WEEK__\s+(SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)\s+(\d{2}:\d{2})\s+(SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)\s+(\d{2}:\d{2})$/i;
const DAY_ORDER = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY"
];
const DAY_TO_JS = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6
};
function parseContractWeekWindow(excludedTimePeriod, excludedDays) {
    const raw = excludedTimePeriod?.trim() ?? "";
    const first = raw.split("\n")[0]?.trim() ?? "";
    const m = first.match(WEEK_MARKER);
    if (m) {
        const sd = m[1].toUpperCase();
        const ed = m[3].toUpperCase();
        return {
            startJsDow: DAY_TO_JS[sd] ?? 0,
            startHm: m[2],
            endJsDow: DAY_TO_JS[ed] ?? 4,
            endHm: m[4]
        };
    }
    const ex = new Set((excludedDays ?? []).map((d) => d.trim().toUpperCase()));
    const work = DAY_ORDER.filter((d) => !ex.has(d));
    if (work.length === 0) {
        return { startJsDow: 0, startHm: "08:00", endJsDow: 6, endHm: "17:00" };
    }
    const start = DAY_TO_JS[work[0]] ?? 0;
    const end = DAY_TO_JS[work[work.length - 1]] ?? 4;
    return { startJsDow: start, startHm: "08:00", endJsDow: end, endHm: "17:00" };
}
function startOfWeekSunday(day) {
    const d = day.startOf("day");
    const luxWd = d.weekday;
    const daysBack = luxWd === 7 ? 0 : luxWd;
    return d.minus({ days: daysBack });
}
function parseHm(hm) {
    const [h, m] = hm.split(":").map((x) => parseInt(x, 10));
    return {
        hour: Number.isFinite(h) ? h : 0,
        minute: Number.isFinite(m) ? m : 0
    };
}
const WEEKDAY_LONG = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];
function formatHm24(hm) {
    const { hour, minute } = parseHm(hm);
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}
function formatContractWeekWindowLabel(w) {
    const sd = WEEKDAY_LONG[w.startJsDow] ?? WEEKDAY_LONG[0];
    const ed = WEEKDAY_LONG[w.endJsDow] ?? WEEKDAY_LONG[4];
    return `${sd} ${formatHm24(w.startHm)} → ${ed} ${formatHm24(w.endHm)}`;
}
function atSundayPlus(sun0, jsDow, hm) {
    const { hour, minute } = parseHm(hm);
    return sun0.plus({ days: jsDow }).set({ hour, minute, second: 0, millisecond: 0 });
}
function overlapMs(a0, a1, b0, b1) {
    const s = +a0 > +b0 ? a0 : b0;
    const e = +a1 < +b1 ? a1 : b1;
    const ms = e.toMillis() - s.toMillis();
    return ms > 0 ? ms : 0;
}
function contactHoursInRange(effStart, effEnd, anchor, zone, w) {
    const z = zone.trim() || "UTC";
    const es = effStart.setZone(z);
    const ee = effEnd.setZone(z);
    const an = anchor.setZone(z);
    const sun = startOfWeekSunday(an);
    let win0 = atSundayPlus(sun, w.startJsDow, w.startHm);
    let win1 = atSundayPlus(sun, w.endJsDow, w.endHm);
    if (+win1 <= +win0) {
        win1 = win1.plus({ days: 7 });
    }
    return overlapMs(es, ee, win0, win1) / 3_600_000;
}
function ymd(dt) {
    return dt.toFormat("yyyy-LL-dd");
}
function splitSegmentUsedHoursByCalendarDay(seg, countingUsed, zone, out) {
    const wall = seg.elapsedWallHours;
    if (wall <= 0 || countingUsed <= 0)
        return;
    const z = zone.trim() || "UTC";
    let t0 = luxon_1.DateTime.fromJSDate(seg.periodFrom, { zone: z });
    const t1 = luxon_1.DateTime.fromJSDate(seg.periodTo, { zone: z });
    if (!t0.isValid || !t1.isValid)
        return;
    if (+t1 <= +t0)
        return;
    let cur = t0.startOf("day");
    const endDay = t1.minus({ milliseconds: 1 }).startOf("day");
    while (+cur <= +endDay) {
        const dayEnd = cur.plus({ days: 1 });
        const segStart = +cur > +t0 ? cur : t0;
        const segEnd = +dayEnd < +t1 ? dayEnd : t1;
        const oh = overlapMs(segStart, segEnd, t0, t1) / 3_600_000;
        if (oh > 0) {
            const k = ymd(cur);
            out.set(k, (out.get(k) ?? 0) + (oh / wall) * countingUsed);
        }
        cur = cur.plus({ days: 1 });
    }
}
const MAX_LEDGER_DAYS = 400;
function buildMotherLaytimeDailyLedger(params) {
    const zone = resolveZone(params.zone);
    const commence = luxon_1.DateTime.fromJSDate(params.commenceAt, { zone }).setZone(zone);
    if (!commence.isValid) {
        return emptyLedger();
    }
    let last = commence;
    for (const s of params.segments) {
        const e = luxon_1.DateTime.fromJSDate(s.periodTo, { zone }).setZone(zone);
        if (e.isValid && +e > +last)
            last = e;
    }
    for (const ev of params.events) {
        const e = luxon_1.DateTime.fromJSDate(ev.eventTime, { zone }).setZone(zone);
        if (e.isValid && +e > +last)
            last = e;
    }
    for (const d of params.dailyDischarges) {
        const e = luxon_1.DateTime.fromJSDate(d.reportDate, { zone }).setZone(zone).endOf("day");
        if (e.isValid && +e > +last)
            last = e;
    }
    let endDay = last.startOf("day");
    if (+endDay < +commence.startOf("day")) {
        endDay = commence.startOf("day");
    }
    let dayCursor = commence.startOf("day");
    const free = params.freeTimeHours;
    const workingByDay = new Map();
    params.segments.forEach((seg, i) => {
        const used = params.segmentCountingUsedHours[i] ?? 0;
        splitSegmentUsedHoursByCalendarDay(seg, used, zone, workingByDay);
    });
    const dischargeByDay = new Map();
    const dischargeRemarkByDay = new Map();
    for (const d of params.dailyDischarges) {
        const dt = luxon_1.DateTime.fromJSDate(d.reportDate, { zone: "utc" }).setZone(zone).startOf("day");
        const k = ymd(dt);
        const q = Number(d.quantity24hMt?.toString?.() ?? d.quantity24hMt);
        if (Number.isFinite(q)) {
            dischargeByDay.set(k, (dischargeByDay.get(k) ?? 0) + q);
        }
        if (d.remarks?.trim()) {
            const prev = dischargeRemarkByDay.get(k);
            dischargeRemarkByDay.set(k, prev ? `${prev}; ${d.remarks.trim()}` : d.remarks.trim());
        }
    }
    const eventsByDay = new Map();
    for (const ev of params.events) {
        const dt = luxon_1.DateTime.fromJSDate(ev.eventTime, { zone }).setZone(zone);
        if (!dt.isValid)
            continue;
        const k = ymd(dt.startOf("day"));
        const clock = dt.toFormat("HH:mm");
        const line = [clock, ev.eventType.replace(/_/g, " "), ev.remarks?.trim()].filter(Boolean).join(" · ");
        if (!eventsByDay.has(k))
            eventsByDay.set(k, []);
        eventsByDay.get(k).push(line);
    }
    const rows = [];
    let cumContact = 0;
    let guard = 0;
    while (+dayCursor <= +endDay && guard++ < MAX_LEDGER_DAYS) {
        const dayStart = dayCursor;
        const dayEnd = dayCursor.plus({ days: 1 });
        const effStart = +dayStart < +commence ? commence : dayStart;
        const effEnd = dayEnd;
        const contact = +effEnd > +effStart ? contactHoursInRange(effStart, effEnd, dayStart, zone, params.week) : 0;
        const k = ymd(dayStart);
        const working = workingByDay.get(k) ?? 0;
        const idle = Math.max(0, 24 - working);
        const prevCum = cumContact;
        cumContact += contact;
        let demurrage = 0;
        if (free !== null && free > 0) {
            if (cumContact <= free) {
                demurrage = 0;
            }
            else if (prevCum < free) {
                demurrage = Math.min(24, cumContact - free);
            }
            else {
                demurrage = 24;
            }
        }
        const dq = dischargeByDay.get(k);
        const parts = [];
        const evL = eventsByDay.get(k);
        if (evL?.length)
            parts.push(evL.join(" | "));
        const dr = dischargeRemarkByDay.get(k);
        if (dr)
            parts.push(dr);
        const activity = parts.join(" · ") || "—";
        rows.push({
            date: k,
            weekday: dayStart.setLocale("en").toFormat("cccc"),
            contactHour: round2(contact),
            workingHour: round2(working),
            idleHour: round2(idle),
            demurrageHour: round2(demurrage),
            dischargeQtyMt: dq !== undefined && Number.isFinite(dq) ? round2(dq) : null,
            activityDetails: activity
        });
        dayCursor = dayCursor.plus({ days: 1 });
    }
    return summarizeLedger(rows);
}
function resolveZone(z) {
    const t = z.trim() || "Asia/Dhaka";
    const p = luxon_1.DateTime.now().setZone(t);
    return p.isValid ? t : "Asia/Dhaka";
}
function round2(n) {
    return Math.round(n * 100) / 100;
}
function emptyLedger() {
    return {
        rows: [],
        totalContactHour: 0,
        totalWorkingHour: 0,
        totalIdleHour: 0,
        totalDemurrageHour: 0,
        totalDischargeQtyMt: 0
    };
}
function summarizeLedger(rows) {
    let tc = 0;
    let tw = 0;
    let ti = 0;
    let td = 0;
    let tq = 0;
    for (const r of rows) {
        tc += r.contactHour;
        tw += r.workingHour;
        ti += r.idleHour;
        td += r.demurrageHour;
        if (r.dischargeQtyMt !== null)
            tq += r.dischargeQtyMt;
    }
    return {
        rows,
        totalContactHour: round2(tc),
        totalWorkingHour: round2(tw),
        totalIdleHour: round2(ti),
        totalDemurrageHour: round2(td),
        totalDischargeQtyMt: round2(tq)
    };
}
//# sourceMappingURL=laytime-mother-daily-ledger.js.map