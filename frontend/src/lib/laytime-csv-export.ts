import type {
  LaytimeBreakdown,
  LaytimeChronologyRow,
  LaytimePortStatementContext,
  MotherLaytimeDailyLedger,
  MotherLaytimeTimesheet
} from "@/lib/sof-api";

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function row(cells: (string | number | null | undefined)[]): string {
  return cells
    .map((v) => {
      if (v === null || v === undefined) return "";
      if (typeof v === "number") {
        return Number.isFinite(v) ? String(v) : "";
      }
      return escapeCsvCell(String(v));
    })
    .join(",");
}

function blankLine(): string {
  return "";
}

function sectionTitle(title: string): string {
  return row([title]);
}

/** Full laytime worksheet CSV: summary, daily table, SOF segments, optional chronology. */
export function buildLaytimeCalculationCsv(params: {
  sofNo: string;
  breakdown: LaytimeBreakdown;
  timesheet: MotherLaytimeTimesheet;
  dailyLedger: MotherLaytimeDailyLedger;
  portStatement?: LaytimePortStatementContext | null;
  chronology?: LaytimeChronologyRow[];
}): string {
  const { sofNo, breakdown, timesheet, dailyLedger, portStatement, chronology = [] } = params;
  const c = timesheet.contractSummary;
  const lines: string[] = [];

  lines.push(sectionTitle("Laytime summary"));
  lines.push(
    row(["Field", "Value"]),
    row(["SOF", sofNo]),
    row(["Vessel", portStatement?.vesselName ?? ""]),
    row(["Port", portStatement?.portName ?? ""]),
    row(["Laytime commence (UTC)", breakdown.commenceAt]),
    row(["Allowed hours", breakdown.allowedHours]),
    row(["Used hours (contact count)", breakdown.usedHours]),
    row(["Excluded hours", breakdown.excludedHours]),
    row(["Demurrage hours", breakdown.demurrageHours]),
    row(["Dispatch hours", breakdown.dispatchHours]),
    row(["Demurrage amount", breakdown.demurrageAmount]),
    row(["Dispatch amount", breakdown.dispatchAmount]),
    row(["Net amount", breakdown.netAmount]),
    row(["Currency", breakdown.currency ?? c.currency ?? ""])
  );

  lines.push(blankLine());
  lines.push(sectionTitle("Contract parameters"));
  lines.push(
    row(["Field", "Value"]),
    row(["Cargo qty (MT)", c.cargoQtyMt]),
    row(["Discharge rate (MT/day)", c.dischargeRateMtPerDay]),
    row(["Contract week", c.contractWeekLabel ?? ""]),
    row(["Allowed source", c.allowedSource]),
    row(["Demurrage rate per day", c.laytimeDemurrageRatePerDay]),
    row(["Dispatch rate per day", c.laytimeDispatchRatePerDay])
  );

  lines.push(blankLine());
  lines.push(sectionTitle("Daily laytime calculation"));
  lines.push(
    row([
      "Date",
      "Starts at",
      "Ends at",
      "Day",
      "Contract (h)",
      "Free (h)",
      "Count (h)",
      "Not count (h)",
      "Total used (h)",
      "Despatch (h)",
      "Demurrage (h)",
      "MT",
      "On demurrage",
      "Laytime expires"
    ])
  );

  for (const r of dailyLedger.rows) {
    lines.push(
      row([
        r.date,
        r.contactStartsAt ?? "",
        r.contactEndsAt ?? "",
        r.weekday,
        r.contactHour,
        r.freeTimeHour,
        r.toCountHour,
        r.notToCountHour,
        r.cumulativeTotalUsedHour,
        r.despatchHour,
        r.demurrageHour,
        r.dischargeQtyMt,
        r.onDemurrage ? "Yes" : "No",
        r.laytimeExpiresThisDay ? "Yes" : "No"
      ])
    );
  }

  lines.push(
    row([
      "Totals",
      "",
      "",
      "",
      dailyLedger.totalContactHour,
      dailyLedger.totalFreeTimeHour ?? "",
      dailyLedger.totalToCountHour ?? dailyLedger.totalWorkingHour,
      dailyLedger.totalNotToCountHour ?? dailyLedger.totalIdleHour,
      dailyLedger.totalCreditedLaytimeHour,
      dailyLedger.totalDespatchHour ?? "",
      dailyLedger.totalDemurrageHour,
      dailyLedger.totalDischargeQtyMt > 0 ? dailyLedger.totalDischargeQtyMt : "",
      "",
      ""
    ])
  );

  if (timesheet.rows.length > 0) {
    lines.push(blankLine());
    lines.push(sectionTitle("SOF event segments"));
    lines.push(
      row([
        "Period from (UTC)",
        "Period to (UTC)",
        "Type",
        "Wall hours",
        "Counting used (h)",
        "Excluded (h)",
        "Accumulated used (h)",
        "Remark"
      ])
    );
    for (const tr of timesheet.rows) {
      lines.push(
        row([
          tr.periodFrom,
          tr.periodTo,
          tr.eventType,
          tr.elapsedWallHours,
          tr.countingUsedHours,
          tr.countingExcludedHours,
          tr.accumulatedUsedHours,
          tr.remark
        ])
      );
    }
  }

  if (chronology.length > 0) {
    lines.push(blankLine());
    lines.push(sectionTitle("Chronology (day slices)"));
    lines.push(
      row([
        "Date",
        "Day",
        "Start",
        "End",
        "Frac",
        "Count (h)",
        "Total used (h)",
        "On demurrage (h)",
        "Remark"
      ])
    );
    for (const ch of chronology) {
      lines.push(
        row([
          ch.date,
          ch.weekday,
          ch.startLocalHm,
          ch.endLocalHm,
          ch.fraction,
          ch.toCountHours,
          ch.totalUsedHours,
          ch.onDemurrageHours,
          ch.remark
        ])
      );
    }
  }

  return lines.join("\r\n");
}

export function downloadLaytimeCalculationCsv(
  params: Parameters<typeof buildLaytimeCalculationCsv>[0]
): void {
  const body = `\uFEFF${buildLaytimeCalculationCsv(params)}`;
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${params.sofNo.replace(/[^a-zA-Z0-9._-]+/g, "_")}-laytime-calculation.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
