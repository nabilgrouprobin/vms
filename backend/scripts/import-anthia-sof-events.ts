/**
 * One-off import: ANTHIA mother SOF events from Excel SOF log (Apr 22 – May 15, 2026).
 * Run: cd backend && npx tsx scripts/import-anthia-sof-events.ts
 */
import { PrismaClient, SOFScope, SOFStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DateTime } from "luxon";
import pg from "pg";

const ZONE = "Asia/Dhaka";
const VESSEL_CALL_ID = "cmp9n6gxj0000063sj2xg6f0k";
const CREATED_BY = "cmoy8plaj0000f73sbsn5mhvm";
const TOTAL_CARGO_MT = 61600;

const EVENT_TYPES = {
  documents: "cmoy9jyqy00063u3s8i1k0x4m",
  draftSurvey: "cmozg5z8m0002uj3szrb8h9va",
  saDraft: "cmoy9rcrz00083u3s7vn2tazy",
  gang: "cmoyhzjyf000f3u3st2nvddgy",
  badWeather: "cmoyhx2rk000e3u3s9f7khrl1",
  discharging: "cmoyhwhr0000d3u3szmnghp3t",
  anchorDrag: "cmoyip8hq000o3u3snigqbte0",
  rainWeather: "cmoyizd2n000r3u3srsaowpfq",
  shipTurning: "cmoyjf8td000y3u3syhvojjrv",
  lighter: "cmoy8286d0002833s228fytoz",
  shifting: "cmoykhsjb001j3u3swk4s53oa",
  prep: "cmoykosab001n3u3sshdczgrl"
} as const;

type Row = {
  start: string;
  end: string;
  duration: string;
  activity: string;
  location?: string;
  dischargeMt?: number;
  remarks?: string;
};

/** Excel rows: start/end as `M/D/YY H:mm`, duration as `H:mm` or `HH:mm`. */
const ROWS: Row[] = [
  { start: "4/22/26 6:30", end: "4/26/26 11:40", duration: "101:10", activity: "DOCUMENTS NOT PREPARE", location: "KUTUBDIA", remarks: "DOCUMENTS ISSUE" },
  { start: "4/26/26 11:40", end: "4/26/26 13:50", duration: "02:10", activity: "SHIPPING AGENT ONBOARD, DRAFT SURVEY AND DOCUMENTS FORMALITIES", location: "KUTUBDIA" },
  { start: "4/26/26 13:50", end: "4/27/26 0:00", duration: "10:10", activity: "GANG ONBOARD FORMALITIES (2 GANG)", location: "KUTUBDIA" },
  { start: "4/27/26 0:00", end: "4/27/26 8:00", duration: "08:00", activity: "GANG ONBOARD FORMALITIES (2 GANG)", location: "KUTUBDIA", remarks: "GANG ONBOARD FORMALITIES" },
  { start: "4/27/26 8:00", end: "4/27/26 21:10", duration: "13:10", activity: "GANG ONBOARD FORMALITIES (2 GANG)", location: "KUTUBDIA" },
  { start: "4/27/26 21:10", end: "4/27/26 21:50", duration: "00:40", activity: "NO WORK DUE TO BAD WEATHER", location: "KUTUBDIA", remarks: "BAD WEATHER ISSUE" },
  { start: "4/27/26 21:50", end: "4/28/26 0:00", duration: "02:10", activity: "NO WORK LIGHTER VESSEL COULD NOT COME ALONGSIDE", location: "KUTUBDIA", remarks: "BAD WEATHER ISSUE. SIGNAL NO-3" },
  { start: "4/28/26 0:00", end: "4/29/26 0:00", duration: "24:00", activity: "NO WORK LIGHTER VESSEL COULD NOT COME ALONGSIDE", location: "KUTUBDIA", remarks: "BAD WEATHER ISSUE. SIGNAL NO-3" },
  { start: "4/29/26 0:00", end: "4/30/26 0:00", duration: "24:00", activity: "NO WORK LIGHTER VESSEL COULD NOT COME ALONGSIDE", location: "KUTUBDIA", remarks: "BAD WEATHER ISSUE. SIGNAL NO-3" },
  { start: "4/30/26 0:00", end: "4/30/26 15:45", duration: "15:45", activity: "NO WORK LIGHTER VESSEL COULD NOT COME ALONGSIDE", location: "KUTUBDIA", remarks: "BAD WEATHER ISSUE. SIGNAL NO-3" },
  { start: "4/30/26 15:45", end: "4/30/26 20:00", duration: "04:15", activity: "DISCHARGING COMMENCED.", location: "KUTUBDIA", dischargeMt: 2436 },
  { start: "4/30/26 20:00", end: "4/30/26 20:55", duration: "00:55", activity: "MOTHER VESSEL CHANGED ANCHOR POSITION DUE TO ANCHOR DRAGGING", location: "KUTUBDIA", remarks: "M/VSL ANCHOR DRAGGING ISSUE" },
  { start: "4/30/26 20:55", end: "5/1/26 0:00", duration: "03:05", activity: "DISCHARGE RUNNING CONTINUE", location: "KUTUBDIA" },
  { start: "5/1/26 0:00", end: "5/1/26 1:10", duration: "01:10", activity: "DISCHARGE RUNNING CONTINUE", location: "KUTUBDIA" },
  { start: "5/1/26 1:10", end: "5/2/26 0:00", duration: "22:50", activity: "NO WORK LIGHTER VESSEL COULD NOT COME ALONGSIDE", location: "KUTUBDIA", remarks: "RAIN & BAD WEATHER ISSUE. SIGNAL NO-3" },
  { start: "5/2/26 0:00", end: "5/2/26 6:20", duration: "06:20", activity: "NO WORK LIGHTER VESSEL COULD NOT COME ALONGSIDE", location: "KUTUBDIA", remarks: "RAIN & BAD WEATHER ISSUE. SIGNAL NO-3" },
  { start: "5/2/26 6:20", end: "5/2/26 7:00", duration: "00:40", activity: "DISCHARGE RUNNING CONTINUE", location: "KUTUBDIA", dischargeMt: 400, remarks: "DISCHARGED CONTINUE" },
  { start: "5/2/26 7:00", end: "5/2/26 11:45", duration: "04:45", activity: "02 GANG WORKING BY SHIPS CRANE DISCHARGING CONTINUE", location: "KUTUBDIA" },
  { start: "5/2/26 11:45", end: "5/2/26 12:35", duration: "00:50", activity: "NO WORK DUE TO BAD WEATHER", location: "KUTUBDIA", remarks: "RAIN & BAD WEATHER ISSUE" },
  { start: "5/2/26 12:35", end: "5/2/26 13:15", duration: "00:40", activity: "DISCHARGE RUNNING CONTINUE", location: "KUTUBDIA" },
  { start: "5/2/26 13:15", end: "5/2/26 14:00", duration: "00:45", activity: "NO WORK DUE TO SHIP TURNING", location: "KUTUBDIA", remarks: "NATURAL ISSUE" },
  { start: "5/2/26 14:00", end: "5/2/26 16:40", duration: "02:40", activity: "DISCHARGE RUNNING CONTINUE", location: "KUTUBDIA" },
  { start: "5/2/26 16:40", end: "5/2/26 22:00", duration: "05:20", activity: "NO WORK DUE TO RAIN & BAD WEATHER", location: "KUTUBDIA", remarks: "RAIN & BAD WEATHER ISSUE" },
  { start: "5/2/26 22:00", end: "5/2/26 22:45", duration: "00:45", activity: "DISCHARGE RUNNING CONTINUE BY 1 GANG", location: "KUTUBDIA" },
  { start: "5/2/26 22:45", end: "5/2/26 23:45", duration: "01:00", activity: "NO WORK DUE TO RAIN & BAD WEATHER", location: "KUTUBDIA", remarks: "RAIN & BAD WEATHER ISSUE" },
  { start: "5/2/26 23:45", end: "5/3/26 0:00", duration: "00:15", activity: "DISCHARGE RUNNING CONTINUE", location: "KUTUBDIA" },
  { start: "5/3/26 0:00", end: "5/3/26 6:15", duration: "06:15", activity: "DISCHARGE RUNNING CONTINUE", location: "KUTUBDIA", dischargeMt: 3789 },
  { start: "5/3/26 6:15", end: "5/3/26 6:45", duration: "00:30", activity: "NO WORK DUE TO RAIN & BAD WEATHER", location: "KUTUBDIA", remarks: "RAIN & BAD WEATHER ISSUE" },
  { start: "5/3/26 6:45", end: "5/3/26 7:00", duration: "00:15", activity: "DISCHARGING CONTINUE", location: "KUTUBDIA" },
  { start: "5/3/26 7:00", end: "5/3/26 16:35", duration: "09:35", activity: "DISCHARGING CONTINUE", location: "KUTUBDIA", dischargeMt: 1174 },
  { start: "5/3/26 16:35", end: "5/3/26 17:50", duration: "01:15", activity: "NO WORK DUE TO RAIN & BAD WEATHER", location: "KUTUBDIA", remarks: "RAIN & BAD WEATHER ISSUE" },
  { start: "5/3/26 17:50", end: "5/3/26 19:20", duration: "01:30", activity: "DISCHARGING CONTINUE", location: "KUTUBDIA" },
  { start: "5/3/26 19:20", end: "5/4/26 0:00", duration: "04:40", activity: "NO WORK DUE TO WAITING FOR LIGHTER VESSEL", location: "KUTUBDIA", remarks: "LIGHTER ISSUE" },
  { start: "5/4/26 0:00", end: "5/4/26 7:00", duration: "07:00", activity: "NO WORK DUE TO WAITING FOR LIGHTER VESSEL", location: "KUTUBDIA", remarks: "LIGHTER ISSUE" },
  { start: "5/4/26 7:00", end: "5/4/26 8:00", duration: "01:00", activity: "02 GANG WORKING BY SHIPS CRANE DISCHARGING CONTINUE", location: "KUTUBDIA" },
  { start: "5/4/26 8:00", end: "5/4/26 8:30", duration: "00:30", activity: "NO WORK DUE TO SHIP TURNING", location: "KUTUBDIA", remarks: "NATURAL ISSUE" },
  { start: "5/4/26 8:30", end: "5/4/26 13:50", duration: "05:20", activity: "DISCHARGING CONTINUE", location: "KUTUBDIA", dischargeMt: 5128 },
  { start: "5/4/26 13:50", end: "5/4/26 14:15", duration: "00:25", activity: "NO WORK DUE TO SHIP TURNING", location: "KUTUBDIA", remarks: "NATURAL ISSUE" },
  { start: "5/4/26 14:15", end: "5/5/26 0:00", duration: "09:45", activity: "DISCHARGING CONTINUE", location: "KUTUBDIA" },
  { start: "5/5/26 0:00", end: "5/5/26 1:00", duration: "01:00", activity: "DISCHARGING CONTINUE", location: "KUTUBDIA" },
  { start: "5/5/26 1:00", end: "5/5/26 7:00", duration: "06:00", activity: "NO WORK DUE TO WAITING FOR LIGHTER VESSEL", location: "KUTUBDIA", remarks: "LIGHTER VESSEL ISSUE" },
  { start: "5/5/26 7:00", end: "5/5/26 11:25", duration: "04:25", activity: "NO WORK DUE TO WAITING FOR LIGHTER VESSEL", location: "KUTUBDIA", remarks: "LIGHTER VESSEL ISSUE" },
  { start: "5/5/26 11:25", end: "5/5/26 12:15", duration: "00:50", activity: "DISCHARGING CONTINUE", location: "KUTUBDIA" },
  { start: "5/5/26 12:15", end: "5/5/26 14:45", duration: "02:30", activity: "NO WORK DUE TO RAIN & BAD WEATHER", location: "KUTUBDIA", remarks: "WEATHER ISSUE" },
  { start: "5/5/26 14:45", end: "5/6/26 0:00", duration: "09:15", activity: "DISCHARGING CONTINUE", location: "KUTUBDIA" },
  { start: "5/6/26 0:00", end: "5/6/26 2:10", duration: "02:10", activity: "DISCHARGING CONTINUE", location: "KUTUBDIA", dischargeMt: 2301 },
  { start: "5/6/26 2:10", end: "5/6/26 7:00", duration: "04:50", activity: "M/VESSEL WAITED FOR HIGH TIDE TO SHIFT", location: "KUTUBDIA", remarks: "M/VESSEL SHIFTING ISSUE" },
  { start: "5/6/26 7:00", end: "5/6/26 9:10", duration: "02:10", activity: "M/VESSEL WAITED FOR HIGH TIDE TO SHIFT", location: "KUTUBDIA", remarks: "M/VESSEL SHIFTING ISSUE" },
  { start: "5/6/26 9:10", end: "5/6/26 12:50", duration: "03:40", activity: "M/VSL SHIFTED FROM KUTUBDIA TO ALPHA ANCHORAGE", location: "KUTUBDIA", remarks: "M/VESSEL SHIFTING ISSUE" },
  { start: "5/6/26 12:50", end: "5/6/26 14:40", duration: "01:50", activity: "NO WORK DUE TO PRIMARY PREPARATION FOR DISCHARGING", location: "OUTER", remarks: "DIS. PREPARATION ISSUE" },
  { start: "5/6/26 14:40", end: "5/6/26 16:30", duration: "01:50", activity: "1 GANG ONBOARD DISCHARGING CONTINUE", location: "OUTER" },
  { start: "5/6/26 16:30", end: "5/6/26 17:00", duration: "00:30", activity: "NO WORK DUE TO SHIP TURNING", location: "OUTER", remarks: "SHIP TURNING ISSUE" },
  { start: "5/6/26 17:00", end: "5/6/26 22:20", duration: "05:20", activity: "1 GANG ONBOARD DISCHARGING CONTINUE", location: "OUTER", dischargeMt: 4213 },
  { start: "5/6/26 22:20", end: "5/6/26 22:50", duration: "00:30", activity: "NO WORK DUE TO SHIP TURNING", location: "OUTER", remarks: "SHIP TURNING ISSUE" },
  { start: "5/6/26 22:50", end: "5/7/26 0:00", duration: "01:10", activity: "DISCHARGING CONTINUE", location: "OUTER" },
  { start: "5/7/26 0:00", end: "5/7/26 1:10", duration: "01:10", activity: "DISCHARGING CONTINUE", location: "OUTER" },
  { start: "5/7/26 1:10", end: "5/7/26 4:10", duration: "03:00", activity: "NO WORK DUE TO RAIN AND BAD WEATHER", location: "OUTER", remarks: "WEATHER ISSUE" },
  { start: "5/7/26 4:10", end: "5/7/26 4:40", duration: "00:30", activity: "DISCHARGING CONTINUE", location: "OUTER" },
  { start: "5/7/26 4:40", end: "5/7/26 5:10", duration: "00:30", activity: "NO WORK DUE TO SHIP TURNING", location: "OUTER", remarks: "SHIP TURNING ISSUE" },
  { start: "5/7/26 5:10", end: "5/7/26 7:00", duration: "01:50", activity: "DISCHARGING CONTINUE", location: "OUTER" },
  { start: "5/7/26 7:00", end: "5/7/26 11:40", duration: "04:40", activity: "DISCHARGING CONTINUE", location: "OUTER", dischargeMt: 6530 },
  { start: "5/7/26 11:40", end: "5/7/26 20:25", duration: "08:45", activity: "NO WORK DUE TO WAITING FOR LIGHTER VESSEL", location: "OUTER", remarks: "LIGHTER VESSEL ISSUE" },
  { start: "5/7/26 20:25", end: "5/7/26 22:45", duration: "02:20", activity: "DISCHARGING CONTINUE", location: "OUTER" },
  { start: "5/7/26 22:45", end: "5/7/26 23:15", duration: "00:30", activity: "NO WORK DUE TO SHIP TURNING", location: "OUTER", remarks: "SHIP TURNING ISSUE" },
  { start: "5/7/26 23:15", end: "5/8/26 0:00", duration: "00:45", activity: "DISCHARGING CONTINUE", location: "OUTER" },
  { start: "5/8/26 0:00", end: "5/8/26 5:20", duration: "05:20", activity: "DISCHARGING CONTINUE", location: "OUTER" },
  { start: "5/8/26 5:20", end: "5/8/26 5:50", duration: "00:30", activity: "NO WORK DUE TO SHIP TURNING", location: "OUTER", remarks: "SHIP TURNING ISSUE" },
  { start: "5/8/26 5:50", end: "5/8/26 7:00", duration: "01:10", activity: "DISCHARGING CONTINUE", location: "OUTER" },
  { start: "5/8/26 7:00", end: "5/9/26 0:00", duration: "17:00", activity: "DISCHARGING CONTINUE (1 GANG CANCELLED)", location: "OUTER" },
  { start: "5/9/26 0:00", end: "5/9/26 7:00", duration: "07:00", activity: "DISCHARGING CONTINUE", location: "OUTER", dischargeMt: 3756 },
  { start: "5/9/26 7:00", end: "5/9/26 10:15", duration: "03:15", activity: "DISCHARGING CONTINUE", location: "OUTER", dischargeMt: 727 },
  { start: "5/9/26 10:15", end: "5/9/26 11:30", duration: "01:15", activity: "NO WORK DUE TO NO READINESS CUSTOM DOCUMENTS", location: "OUTER", remarks: "DOCUMENTS ISSUE" },
  { start: "5/9/26 11:30", end: "5/10/26 0:00", duration: "12:30", activity: "ALL GANG DISEMBARK — DOCUMENTS", location: "OUTER", remarks: "DOCUMENTS ISSUE" },
  { start: "5/10/26 0:00", end: "5/10/26 21:25", duration: "21:25", activity: "ALL GANG DISEMBARK", location: "OUTER", remarks: "DOCUMENTS ISSUE" },
  { start: "5/10/26 21:25", end: "5/10/26 22:20", duration: "00:55", activity: "02 GANG ONBOARD, NO WORK DUE TO PREPARATION FOR DISCHARGING", location: "OUTER", remarks: "DIS. PREPARATION ISSUE" },
  { start: "5/10/26 22:20", end: "5/11/26 0:00", duration: "01:40", activity: "DISCHARGING CONTINUE", location: "OUTER" },
  { start: "5/11/26 0:00", end: "5/11/26 7:00", duration: "07:00", activity: "DISCHARGING CONTINUE", location: "OUTER", dischargeMt: 2213 },
  { start: "5/11/26 7:00", end: "5/12/26 0:00", duration: "17:00", activity: "DAY 03 GANG & NIGHT 04 GANG WORKING DISCHARGING CONTINUE", location: "OUTER" },
  { start: "5/12/26 0:00", end: "5/12/26 7:00", duration: "07:00", activity: "DAY 03 GANG & NIGHT 04 GANG WORKING DISCHARGING CONTINUE", location: "OUTER", dischargeMt: 8912 },
  { start: "5/12/26 7:00", end: "5/13/26 0:00", duration: "17:00", activity: "4 GANG WORKING CONTINUE", location: "OUTER" },
  { start: "5/13/26 0:00", end: "5/13/26 7:00", duration: "07:00", activity: "4 GANG WORKING CONTINUE", location: "OUTER", dischargeMt: 9522 },
  { start: "5/13/26 7:00", end: "5/14/26 0:00", duration: "17:00", activity: "4 GANG WORKING CONTINUE", location: "OUTER" },
  { start: "5/14/26 0:00", end: "5/14/26 4:15", duration: "04:15", activity: "4 GANG WORKING CONTINUE", location: "OUTER", dischargeMt: 7400.2 },
  { start: "5/14/26 4:15", end: "5/14/26 7:00", duration: "02:45", activity: "NO WORK DUE TO RAIN", location: "OUTER", remarks: "RAIN & BAD WEATHER ISSUE" },
  { start: "5/14/26 7:00", end: "5/14/26 10:00", duration: "03:00", activity: "NO WORK DUE TO RAIN & BAD WEATHER", location: "OUTER", remarks: "RAIN & BAD WEATHER ISSUE" },
  { start: "5/14/26 10:00", end: "5/14/26 23:20", duration: "13:20", activity: "DISCHARGING CONTINUE", location: "OUTER", dischargeMt: 2389.74 },
  { start: "5/14/26 23:20", end: "5/15/26 0:00", duration: "00:40", activity: "NO WORK DUE TO RAIN & BAD WEATHER", location: "OUTER", remarks: "RAIN & BAD WEATHER ISSUE" },
  { start: "5/15/26 0:00", end: "5/15/26 0:20", duration: "00:20", activity: "NO WORK DUE TO RAIN & BAD WEATHER", location: "OUTER", remarks: "RAIN & BAD WEATHER ISSUE" },
  { start: "5/15/26 0:20", end: "5/15/26 1:00", duration: "00:40", activity: "DISCHARGING CONTINUE", location: "OUTER" },
  { start: "5/15/26 1:00", end: "5/15/26 3:10", duration: "02:10", activity: "NO WORK DUE TO RAIN & BAD WEATHER", location: "OUTER", remarks: "RAIN & BAD WEATHER ISSUE" },
  { start: "5/15/26 3:10", end: "5/15/26 7:00", duration: "03:50", activity: "DISCHARGING CONTINUE", location: "OUTER" },
  { start: "5/15/26 7:00", end: "5/15/26 13:40", duration: "06:40", activity: "DISCHARGING CONTINUE", location: "OUTER", dischargeMt: 600.06 },
  { start: "5/15/26 13:40", end: "5/15/26 13:40", duration: "00:00", activity: "ALL CARGO DISCHARGING COMPLETED", location: "OUTER", remarks: "COMPLETED" }
];

function parseMdYyHm(s: string): Date {
  const [datePart, timePart] = s.trim().split(/\s+/);
  const [m, d, y] = datePart.split("/").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  const year = y < 100 ? 2000 + y : y;
  const dt = DateTime.fromObject(
    { year, month: m, day: d, hour: hh, minute: mm },
    { zone: ZONE }
  );
  if (!dt.isValid) throw new Error(`Invalid datetime: ${s}`);
  return dt.toUTC().toJSDate();
}

function parseDurationHm(hhmm: string): number {
  const parts = hhmm.trim().split(":").map(Number);
  if (parts.length !== 2) throw new Error(`Invalid duration: ${hhmm}`);
  const mins = parts[0] * 60 + parts[1];
  return mins < 1 ? 1 : mins;
}

function pickEventType(row: Row): { id: string; isHold: boolean } {
  const text = `${row.activity} ${row.remarks ?? ""}`.toUpperCase();
  if (/DOCUMENT|DISEMBARK|CUSTOM|NOT PREPARE/.test(text)) {
    return { id: EVENT_TYPES.documents, isHold: true };
  }
  if (/DISCHARG|GANG WORKING|COMMENCED|CONTINUE/.test(text) && !/NO WORK/.test(text)) {
    return { id: EVENT_TYPES.discharging, isHold: false };
  }
  if (/ANCHOR DRAG|ANCHOR POSITION/.test(text)) {
    return { id: EVENT_TYPES.anchorDrag, isHold: true };
  }
  if (/SHIFT|HIGH TIDE|ALPHA/.test(text)) {
    return { id: EVENT_TYPES.shifting, isHold: true };
  }
  if (/PREPARATION/.test(text)) {
    return { id: EVENT_TYPES.prep, isHold: true };
  }
  if (/SHIP TURNING|NATURAL ISSUE/.test(text)) {
    return { id: EVENT_TYPES.shipTurning, isHold: true };
  }
  if (/LIGHTER|LIGHTER ISSUE/.test(text)) {
    return { id: EVENT_TYPES.lighter, isHold: true };
  }
  if (/RAIN|RAIN &/.test(text)) {
    return { id: EVENT_TYPES.rainWeather, isHold: true };
  }
  if (/BAD WEATHER|SIGNAL NO/.test(text)) {
    return { id: EVENT_TYPES.badWeather, isHold: true };
  }
  if (/DRAFT SURVEY|SHIPPING AGENT/.test(text)) {
    return { id: EVENT_TYPES.draftSurvey, isHold: true };
  }
  if (/GANG ONBOARD/.test(text)) {
    return { id: EVENT_TYPES.gang, isHold: true };
  }
  if (/COMPLETED/.test(text)) {
    return { id: EVENT_TYPES.discharging, isHold: false };
  }
  return { id: EVENT_TYPES.badWeather, isHold: true };
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const vc = await prisma.vesselCall.findUnique({
      where: { id: VESSEL_CALL_ID },
      include: { vessel: true, statementOfFacts: true }
    });
    if (!vc) throw new Error(`Vessel call ${VESSEL_CALL_ID} not found`);

    await prisma.vesselCall.update({
      where: { id: VESSEL_CALL_ID },
      data: {
        approxTotalWeightTon: TOTAL_CARGO_MT,
        laytimeTimeZone: ZONE
      }
    });

    let sof = vc.statementOfFacts;
    if (!sof) {
      sof = await prisma.statementOfFacts.create({
        data: {
          sofNo: `SOF-${vc.callNo}`,
          scope: SOFScope.MOTHER_VESSEL,
          vesselCallId: VESSEL_CALL_ID,
          status: SOFStatus.DRAFT,
          startedAt: parseMdYyHm(ROWS[0].start),
          completedAt: parseMdYyHm(ROWS[ROWS.length - 1].end),
          laytimeDischargeRateMtPerDay: 5000,
          remarks: `Imported from Excel SOF — ${vc.vessel.name}`
        }
      });
      console.log(`Created SOF ${sof.sofNo} (${sof.id})`);
    } else {
      await prisma.sofEvent.deleteMany({ where: { statementId: sof.id } });
      await prisma.sofHourlyStatus.deleteMany({ where: { statementId: sof.id } });
      await prisma.statementOfFacts.update({
        where: { id: sof.id },
        data: {
          startedAt: parseMdYyHm(ROWS[0].start),
          completedAt: parseMdYyHm(ROWS[ROWS.length - 1].end),
          laytimeDischargeRateMtPerDay: 5000,
          status: SOFStatus.DRAFT
        }
      });
      console.log(`Cleared existing events on SOF ${sof.sofNo} (${sof.id})`);
    }

    let cumulativeDischarge = 0;
    let rob = TOTAL_CARGO_MT;

    const events = ROWS.map((row) => {
      const end = parseMdYyHm(row.end);
      const durationMinutes = parseDurationHm(row.duration);
      const { id: eventTypeId, isHold } = pickEventType(row);
      if (row.dischargeMt != null && row.dischargeMt > 0) {
        cumulativeDischarge += row.dischargeMt;
        rob = Math.max(0, TOTAL_CARGO_MT - cumulativeDischarge);
      }
      const remarksParts = [row.activity.trim()];
      if (row.remarks?.trim()) remarksParts.push(row.remarks.trim());
      if (row.location) remarksParts.push(`@ ${row.location}`);
      return {
        statementId: sof!.id,
        eventTypeId,
        eventTime: end,
        durationMinutes,
        durationHours: null,
        countsAsLaytime: !isHold,
        location: row.location ?? null,
        dischargeQuantityMt: row.dischargeMt ?? null,
        cumulativeDischargeMt: row.dischargeMt != null ? cumulativeDischarge : null,
        robQuantityMt: row.dischargeMt != null ? rob : null,
        isHold,
        holdReason: isHold ? row.remarks ?? row.activity : null,
        remarks: remarksParts.join(" · "),
        supportingDocuments: [],
        createdBy: CREATED_BY
      };
    });

    await prisma.sofEvent.createMany({ data: events });
    console.log(`Inserted ${events.length} events for ${vc.vessel.name} / ${vc.callNo}`);
    console.log(`Open Vessel SOF → select ${sof.sofNo} → Events tab → Recalculate laytime.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
