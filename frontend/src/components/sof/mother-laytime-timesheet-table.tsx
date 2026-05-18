"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { formatDt, formatNum } from "@/lib/format";
import {
  coerceFiniteNumber,
  formatDecimalHoursToDaysHMin,
  formatDecimalHoursToHMin,
  formatDecimalHoursToTotalHoursMin,
  formatLaytimeDecimalHours
} from "@/lib/laytime-hours-format";
import type {
  LaytimeBreakdown,
  LaytimeChronologyRow,
  LaytimePortStatementContext,
  MotherLaytimeDailyLedger,
  MotherLaytimeTimesheet
} from "@/lib/sof-api";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatGmtOffsetForZone } from "@/lib/timezone-gmt";
import { cn } from "@/lib/utils";

function formatMoney(amount: number | null, currency: string | null): string {
  if (amount === null || !Number.isFinite(amount)) return "—";
  const code = currency && /^[A-Z]{3}$/i.test(currency) ? currency.toUpperCase() : "USD";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code}`;
  }
}

function fmtQtyMt(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return "—";
  return `${v.toLocaleString("en-US", { maximumFractionDigits: 3 })} MT`;
}

function fmtRate(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return "—";
  return `${v.toLocaleString("en-US", { maximumFractionDigits: 2 })} MT/day`;
}

function fmt2(n: unknown): string {
  return formatLaytimeDecimalHours(n);
}

function Th({
  children,
  title,
  className
}: {
  children: ReactNode;
  title: string;
  className?: string;
}) {
  return (
    <th
      title={title}
      className={cn(
        "px-2 py-2 text-right text-[11px] font-semibold text-muted-foreground",
        className
      )}
    >
      {children}
    </th>
  );
}

function fmtLaysoftDhm(hours: number): string {
  const mins = Math.round(Math.max(0, hours) * 60);
  const d = Math.floor(mins / (24 * 60));
  const r = mins % (24 * 60);
  const h = Math.floor(r / 60);
  const m = r % 60;
  return `${d}d-${String(h).padStart(2, "0")}h-${String(m).padStart(2, "0")}m`;
}

/** Laytime2000-style decimal days for demurrage / dispatch (5 decimal places). */
function fmtLaytimeDecimalDays(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "0.00000";
  return (hours / 24).toFixed(5);
}

const DEM_EPS = 1e-4;

function chronologyRowOnDemurrage(
  r: LaytimeChronologyRow,
  allowedHours: number | null,
  index: number,
  rows: LaytimeChronologyRow[]
): boolean {
  if (r.onDemurrageHours > DEM_EPS) return true;
  if (r.remark.includes("Laytime Expires")) return true;
  if (allowedHours != null && r.totalUsedHours > allowedHours + DEM_EPS) return true;
  if (index > 0 && rows[index - 1]!.onDemurrageHours > DEM_EPS) return true;
  return false;
}

/** Subtle row accent — no full-row red wash (keeps numbers readable). */
const demurrageRowClass =
  "border-l-4 border-l-amber-500 bg-amber-50/35 dark:border-l-amber-400 dark:bg-amber-950/20";

const laytimeExpiresRowClass =
  "border-l-4 border-l-amber-400 bg-amber-50/50 dark:border-l-amber-300 dark:bg-amber-950/25";

function LaytimeHourCell({
  value,
  variant = "default"
}: {
  value: unknown;
  variant?: "default" | "contact" | "demurrage" | "muted";
}) {
  const n = coerceFiniteNumber(value);
  const display = formatLaytimeDecimalHours(value);
  const isZero = n === null || n <= 0.005;

  if (isZero && variant !== "demurrage") {
    return <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">—</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex min-w-[2.75rem] justify-end rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums leading-none",
        variant === "default" && "text-foreground",
        variant === "muted" && "font-medium text-muted-foreground",
        variant === "contact" &&
          "border border-emerald-300/90 bg-emerald-50 text-emerald-950 shadow-sm dark:border-emerald-600/50 dark:bg-emerald-950/50 dark:text-emerald-50",
        variant === "demurrage" &&
          "border border-amber-500/80 bg-white text-amber-950 shadow-sm dark:border-amber-400/70 dark:bg-zinc-900 dark:text-amber-50"
      )}
    >
      {display}
    </span>
  );
}

function DailySheetLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border bg-muted/15 px-2 py-1 text-[10px] text-muted-foreground">
      <span className="font-semibold text-foreground">Daily sheet</span>
      <span>
        Contract = hours in the working window (Starts at / Ends at). Free = day in laytime minus
        contract. Count + Not count = contract (from Events). Despatch = allowed − total used.
      </span>
      <span className="inline-flex items-center gap-1">
        <LaytimeHourCell value={16} variant="contact" />
        contact
      </span>
      <span className="inline-flex items-center gap-1">
        <LaytimeHourCell value={24} variant="demurrage" />
        demurrage
      </span>
    </div>
  );
}

export type MotherLaytimeTimesheetLayout = "default" | "priority";

export function MotherLaytimeTimesheetTable({
  dailyLedger,
  timesheet,
  breakdown,
  chronology = [],
  portStatement = null,
  className,
  sheetLayout = "priority"
}: {
  dailyLedger: MotherLaytimeDailyLedger;
  timesheet: MotherLaytimeTimesheet;
  breakdown: LaytimeBreakdown;
  /** Day-split chronology (Laytime2000-style); empty until recalculate returns rows. */
  chronology?: LaytimeChronologyRow[];
  /** Vessel / port / NOR lines above the chronology (Laytime2000 port statement). */
  portStatement?: LaytimePortStatementContext | null;
  className?: string;
  /** priority: daily + event tables first; supporting text in a collapsible. */
  sheetLayout?: MotherLaytimeTimesheetLayout;
}) {
  const c = timesheet.contractSummary;
  const freeH = breakdown.allowedHours;
  const weekLabel = c.contractWeekLabel;
  const priority = sheetLayout === "priority";
  const resolvedZoneGmt = formatGmtOffsetForZone(c.laytimeResolvedTimeZone);

  const dailyTable = (
    <div className="space-y-3">
      <div className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[780px] border-collapse text-[11px]">
          <thead className="sticky top-0 z-[1] bg-muted/98 backdrop-blur-sm">
            <tr className="border-b border-border">
              <th className="px-2 py-1 text-left text-[10px] font-semibold text-foreground">Date</th>
              <th className="px-2 py-1 text-left text-[10px] font-semibold text-foreground">
                Starts at
              </th>
              <th className="px-2 py-1 text-left text-[10px] font-semibold text-foreground">
                Ends at
              </th>
              <th className="px-2 py-1 text-left text-[10px] font-semibold text-foreground">Day</th>
              <Th
                className="border-l border-border/80"
                title="Contract hours this day (NOR rules on tender day; 24h after demurrage)."
              >
                Contract
              </Th>
              <Th title="Duration minus contact.">Free</Th>
              <Th title="SOF hours in contact window tagged Count.">Count</Th>
              <Th title="Not count in the contract contact window. Includes SOF periods marked Not count on this calendar day (even before contact opens). Count + Not count = Contract.">
                Not count
              </Th>
              <Th title="Cumulative sum of Count hours (against allowance).">Total used</Th>
              <Th title="Allowed laytime − cumulative total used (Count).">
                Despatch
              </Th>
              <Th
                className="border-l border-border/80 bg-amber-50/80 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
                title="Total used minus allowed hours (when over allowance)."
              >
                Demurrage
              </Th>
              <Th className="border-l border-border/80" title="Discharge MT (24h).">
                MT
              </Th>
            </tr>
          </thead>
          <tbody>
            {dailyLedger.rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-6 text-center text-[11px] text-muted-foreground">
                No calendar days in range. Set commence / NOR and add events or discharge rows.
              </td>
            </tr>
          ) : (
            dailyLedger.rows.map((r, rowIdx) => {
              const contactH = coerceFiniteNumber(r.contactHour) ?? 0;
              const demH = coerceFiniteNumber(r.demurrageHour) ?? 0;
              const onDem = Boolean(r.onDemurrage);
              const expires = Boolean(r.laytimeExpiresThisDay);
              return (
                <tr
                  key={r.date}
                  className={cn(
                    "border-b border-border/70 transition-colors hover:bg-muted/25",
                    rowIdx % 2 === 1 && !onDem && !expires && "bg-muted/10",
                    expires && laytimeExpiresRowClass,
                    onDem && !expires && demurrageRowClass
                  )}
                  title={
                    expires
                      ? "Allowed laytime ends today — demurrage from here; weekends and holidays still count."
                      : onDem
                        ? "On demurrage — full calendar time (24h per day)."
                        : undefined
                  }
                >
                  <td className="whitespace-nowrap px-2 py-1 font-mono text-[10px] tabular-nums text-foreground">
                    {r.date}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1 font-mono text-[10px] tabular-nums text-foreground">
                    {r.contactStartsAt ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1 font-mono text-[10px] tabular-nums text-foreground">
                    {r.contactEndsAt ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1 text-[10px] capitalize text-foreground">
                    {r.weekday.slice(0, 3)}
                  </td>
                  <td className="border-l border-border/50 px-2 py-1 text-right">
                    <LaytimeHourCell
                      value={r.contactHour}
                      variant={onDem ? "default" : contactH > 0.005 ? "contact" : "muted"}
                    />
                  </td>
                  <td className="px-2 py-1 text-right">
                    <LaytimeHourCell value={r.freeTimeHour} variant="muted" />
                  </td>
                  <td className="px-2 py-1 text-right">
                    <LaytimeHourCell
                      value={r.toCountHour ?? r.workingHour}
                      variant="default"
                    />
                  </td>
                  <td className="px-2 py-1 text-right">
                    <LaytimeHourCell
                      value={r.notToCountHour ?? r.idleHour}
                      variant={
                        (coerceFiniteNumber(r.notToCountHour) ?? 0) > 0.005
                          ? "default"
                          : "muted"
                      }
                    />
                  </td>
                  <td className="px-2 py-1 text-right">
                    <LaytimeHourCell
                      value={r.cumulativeTotalUsedHour ?? r.cumulativeCreditedHour ?? 0}
                      variant={
                        onDem
                          ? "demurrage"
                          : freeH != null &&
                              (coerceFiniteNumber(r.cumulativeTotalUsedHour) ?? 0) >=
                                freeH - 0.005
                            ? "demurrage"
                            : "default"
                      }
                    />
                  </td>
                  <td className="px-2 py-1 text-right">
                    <LaytimeHourCell
                      value={r.despatchHour ?? 0}
                      variant={
                        (coerceFiniteNumber(r.despatchHour) ?? 0) > 0.005 ? "contact" : "muted"
                      }
                    />
                  </td>
                  <td className="border-l border-border/50 bg-amber-50/30 px-2 py-1 text-right dark:bg-amber-950/15">
                    {expires && demH <= 0.005 ? (
                      <span className="text-[10px] font-semibold text-amber-900 dark:text-amber-100">
                        Expires
                      </span>
                    ) : (
                      <LaytimeHourCell
                        value={r.demurrageHour}
                        variant={demH > 0.005 ? "demurrage" : "muted"}
                      />
                    )}
                  </td>
                  <td className="border-l border-border/50 px-2 py-1 text-right font-mono text-[10px] tabular-nums text-foreground">
                    {r.dischargeQtyMt !== null ? fmt2(r.dischargeQtyMt) : "—"}
                  </td>
                </tr>
              );
            })
          )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/40">
              <td colSpan={4} className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                <span className="block">Totals</span>
                <span className="block font-normal text-[9px] text-muted-foreground/90">
                  Contract days only (excl. weekly off &amp; holidays)
                </span>
              </td>
              <td className="border-l border-border/50 px-2 py-1 text-right font-mono text-[10px] font-semibold tabular-nums">
                {fmt2(dailyLedger.totalContactHour)}
              </td>
              <td className="px-2 py-1 text-right font-mono text-[10px] font-semibold tabular-nums">
                {fmt2(dailyLedger.totalFreeTimeHour ?? 0)}
              </td>
              <td className="px-2 py-1 text-right font-mono text-[10px] font-semibold tabular-nums">
                {fmt2(dailyLedger.totalToCountHour ?? dailyLedger.totalWorkingHour)}
              </td>
              <td className="px-2 py-1 text-right font-mono text-[10px] font-semibold tabular-nums">
                {fmt2(dailyLedger.totalNotToCountHour ?? dailyLedger.totalIdleHour)}
              </td>
              <td className="px-2 py-1 text-right font-mono text-[10px] font-semibold tabular-nums">
                {fmt2(
                  dailyLedger.totalToCountHour ??
                    dailyLedger.totalCreditedLaytimeHour ??
                    dailyLedger.totalWorkingHour ??
                    0
                )}
              </td>
              <td className="px-2 py-1 text-right font-mono text-[10px] font-semibold tabular-nums">
                {fmt2(dailyLedger.totalDespatchHour ?? 0)}
              </td>
              <td className="border-l border-border/50 bg-amber-50/40 px-2 py-1 text-right font-mono text-[10px] font-semibold tabular-nums text-amber-950 dark:bg-amber-950/25 dark:text-amber-100">
                {fmt2(dailyLedger.totalDemurrageHour)}
              </td>
              <td className="border-l border-border/50 px-2 py-1 text-right font-mono text-[10px] font-semibold tabular-nums">
                {dailyLedger.totalDischargeQtyMt > 0
                  ? fmt2(dailyLedger.totalDischargeQtyMt)
                  : "—"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-xs">
          <p className="font-medium text-muted-foreground">Laytime used</p>
          <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatDecimalHoursToHMin(breakdown.usedHours)}
          </p>
          {breakdown.allowedHours != null ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Allowed {formatDecimalHoursToDaysHMin(breakdown.allowedHours)} (
              {formatDecimalHoursToTotalHoursMin(breakdown.allowedHours)})
            </p>
          ) : null}
        </div>
        <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-xs">
          <p className="font-medium text-muted-foreground">Balance</p>
          <p
            className={cn(
              "mt-1 font-mono text-sm font-semibold tabular-nums",
              (coerceFiniteNumber(breakdown.balanceHours) ?? 0) < -0.01
                ? "text-amber-800 dark:text-amber-200"
                : "text-foreground"
            )}
          >
            {formatDecimalHoursToHMin(breakdown.balanceHours)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Dispatch {formatDecimalHoursToHMin(breakdown.dispatchHours)}
          </p>
        </div>
        <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2.5 text-xs dark:border-amber-800/50 dark:bg-amber-950/30 sm:col-span-2 lg:col-span-1">
          <p className="font-medium text-amber-900/80 dark:text-amber-200/90">Money</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
            Dem. {formatMoney(breakdown.demurrageAmount, breakdown.currency)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Disp. {formatMoney(breakdown.dispatchAmount, breakdown.currency)} · Net{" "}
            {formatMoney(breakdown.netAmount, breakdown.currency)}
          </p>
        </div>
      </div>
    </div>
  );

  const chronologyTable =
    chronology.length === 0 ? null : (
      <div className="w-full overflow-x-auto rounded-xl border border-border bg-card text-sm shadow-sm">
        <table className="w-full min-w-[900px] border-collapse xl:min-w-[1000px]">
          <thead className="bg-muted/90">
            <tr className="border-b border-border">
              <th className="px-2 py-2 text-left text-[11px] font-semibold text-muted-foreground">
                Day
              </th>
              <th className="px-2 py-2 text-left text-[11px] font-semibold text-muted-foreground">
                Date
              </th>
              <th className="px-2 py-2 text-left text-[11px] font-semibold text-muted-foreground">
                Start
              </th>
              <th className="px-2 py-2 text-left text-[11px] font-semibold text-muted-foreground">
                End
              </th>
              <th className="px-2 py-2 text-right text-[11px] font-semibold text-muted-foreground">
                Frac
              </th>
              <th className="px-2 py-2 text-left text-[11px] font-semibold text-muted-foreground">
                Remark
              </th>
              <th className="px-2 py-2 text-right text-[11px] font-semibold text-muted-foreground">
                Count
              </th>
              <th className="px-2 py-2 text-right text-[11px] font-semibold text-muted-foreground">
                Total time
              </th>
              <th className="px-2 py-2 text-right text-[11px] font-semibold text-muted-foreground">
                On dem
              </th>
            </tr>
          </thead>
          <tbody>
            {chronology.map((r, i) => {
              const onDem = chronologyRowOnDemurrage(r, freeH, i, chronology);
              return (
              <tr
                key={`${r.date}-${r.startLocalHm}-${r.endLocalHm}-${i}`}
                className={cn(
                  "border-b border-border/70",
                  onDem && demurrageRowClass,
                  i % 2 === 1 && !onDem && "bg-muted/10"
                )}
              >
                <td className="whitespace-nowrap px-3 py-2 capitalize text-foreground">{r.weekday}</td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{r.date}</td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{r.startLocalHm}</td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{r.endLocalHm}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-mono tabular-nums">
                  {r.fraction}
                </td>
                <td
                  className={cn(
                    "max-w-[14rem] truncate px-2 py-1 text-[10px]",
                    r.remark.includes("Laytime Expires") &&
                      "font-semibold text-amber-900 dark:text-amber-100"
                  )}
                  title={r.remark}
                >
                  {r.remark}
                </td>
                <td className="whitespace-nowrap px-2 py-1 text-right font-mono text-[11px]">
                  {fmtLaysoftDhm(r.toCountHours)}
                </td>
                <td className="whitespace-nowrap px-2 py-1 text-right font-mono text-[11px] tabular-nums text-foreground">
                  {fmtLaysoftDhm(r.totalUsedHours)}
                </td>
                <td
                  className={cn(
                    "whitespace-nowrap px-2 py-1 text-right font-mono text-[11px] tabular-nums",
                    onDem && r.onDemurrageHours > DEM_EPS && "font-semibold text-red-700 dark:text-red-300"
                  )}
                >
                  {fmtLaysoftDhm(r.onDemurrageHours)}
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    );

  const eventsTable = (
    <div className="w-full overflow-x-auto text-xs">
      <table className="w-full min-w-[960px] border-collapse xl:min-w-[1100px]">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-2 py-2 text-left text-[11px] font-semibold text-muted-foreground">
              Event starts
            </th>
            <th className="px-2 py-2 text-left text-[11px] font-semibold text-muted-foreground">
              Event ends
            </th>
            <th className="px-2 py-2 text-right text-[11px] font-semibold text-muted-foreground">
              Used h
            </th>
            <th className="px-2 py-2 text-left text-[11px] font-semibold text-muted-foreground">
              Remark
            </th>
          </tr>
        </thead>
        <tbody>
          {timesheet.rows.map((row) => (
            <tr
              key={`${row.periodFrom}-${row.periodTo}-${row.closingEventId ?? ""}`}
              className="border-b"
            >
              <td className="whitespace-nowrap px-2 py-1.5 font-mono text-[11px]">
                {formatDt(row.periodFrom)}
              </td>
              <td className="whitespace-nowrap px-2 py-1.5 font-mono text-[11px]">
                {formatDt(row.periodTo)}
              </td>
              <td className="px-2 py-1.5 text-right font-mono text-[11px]">
                {formatDecimalHoursToHMin(row.countingUsedHours)}
              </td>
              <td
                className="max-w-[20rem] truncate px-2 py-1 text-[10px] text-foreground"
                title={row.remark}
              >
                {row.remark}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const laytimeStatementSummary = (
    <div className="rounded-md border border-border/80 bg-muted/20 p-3 text-xs">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Laytime statement summary
      </p>
      <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
        Same figures as a Laytime2000 summary page: durations as{" "}
        <span className="font-mono text-foreground">Xd-XXh-XXm</span>, then decimal days × rate.
      </p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse">
          <tbody className="[&_td]:border-border [&_tr]:border-b [&_tr]:border-border">
            <tr>
              <td className="px-2 py-1.5 font-medium text-muted-foreground">Laytime allowed</td>
              <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                {freeH != null ? fmtLaysoftDhm(freeH) : "—"}
              </td>
            </tr>
            <tr>
              <td className="px-2 py-1.5 font-medium text-muted-foreground">Laytime used</td>
              <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                {fmtLaysoftDhm(breakdown.usedHours)}
              </td>
            </tr>
            <tr>
              <td className="px-2 py-1.5 font-medium text-muted-foreground">
                Time lost (demurrage time)
              </td>
              <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                {freeH != null ? fmtLaysoftDhm(breakdown.demurrageHours) : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-[10px] text-muted-foreground">Demurrage (per day)</dt>
          <dd className="font-mono text-sm font-medium tabular-nums">
            {c.laytimeDemurrageRatePerDay != null
              ? formatMoney(c.laytimeDemurrageRatePerDay, c.currency)
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] text-muted-foreground">Despatch (per day)</dt>
          <dd className="font-mono text-sm font-medium tabular-nums">
            {c.laytimeDispatchRatePerDay != null
              ? formatMoney(c.laytimeDispatchRatePerDay, c.currency)
              : "—"}
          </dd>
        </div>
      </dl>
      <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-[11px] leading-relaxed">
        {breakdown.demurrageHours > 1e-6 &&
        breakdown.demurrageAmount != null &&
        c.laytimeDemurrageRatePerDay != null ? (
          <p>
            <span className="text-muted-foreground">Discharge / ops result:</span>{" "}
            <span className="font-mono font-medium tabular-nums text-foreground">
              {fmtLaytimeDecimalDays(breakdown.demurrageHours)} days @{" "}
              {formatMoney(c.laytimeDemurrageRatePerDay, c.currency)} / day ={" "}
              {formatMoney(breakdown.demurrageAmount, c.currency)} demurrage
            </span>
          </p>
        ) : (
          <p className="text-muted-foreground">
            No demurrage accrual, or demurrage rate / allowance not set.
          </p>
        )}
        {breakdown.dispatchHours > 1e-6 &&
        breakdown.dispatchAmount != null &&
        c.laytimeDispatchRatePerDay != null ? (
          <p>
            <span className="text-muted-foreground">Dispatch credit:</span>{" "}
            <span className="font-mono font-medium tabular-nums text-foreground">
              {fmtLaytimeDecimalDays(breakdown.dispatchHours)} days @{" "}
              {formatMoney(c.laytimeDispatchRatePerDay, c.currency)} / day ={" "}
              {formatMoney(breakdown.dispatchAmount, c.currency)}
            </span>
          </p>
        ) : null}
        <p className="text-right text-sm font-semibold text-foreground">
          Net due{" "}
          {formatMoney(breakdown.netAmount, breakdown.currency ?? c.currency)}
        </p>
      </div>
    </div>
  );

  const portStatementAndParams =
    portStatement != null ? (
      <div className="mb-3 rounded-md border border-border/60 bg-muted/15 p-3 text-[11px] leading-relaxed">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Port statement
        </p>
        <dl className="mt-2 grid gap-x-4 gap-y-2 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Vessel</dt>
            <dd className="font-medium text-foreground">{portStatement.vesselName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Voyage / call</dt>
            <dd className="font-medium text-foreground">{portStatement.voyageLine ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Port</dt>
            <dd className="font-medium text-foreground">{portStatement.portName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Operation</dt>
            <dd className="font-medium text-foreground">{portStatement.operationLabel}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Arrived</dt>
            <dd className="text-foreground">{portStatement.arrivedLine ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">NOR tendered</dt>
            <dd className="text-foreground">{portStatement.norTenderedLine ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">In berth / discharge activity</dt>
            <dd className="text-foreground">{portStatement.inBerthOrWorkingLine ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Time to count from</dt>
            <dd className="font-mono text-foreground">{formatDt(breakdown.commenceAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Laytime allowed</dt>
            <dd className="font-mono font-medium tabular-nums text-foreground">
              {freeH != null ? fmtLaysoftDhm(freeH) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Laytime used</dt>
            <dd className="font-mono font-medium tabular-nums text-foreground">
              {fmtLaysoftDhm(breakdown.usedHours)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Laytime calculation parameters
        </p>
        <dl className="mt-2 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Quantity</dt>
            <dd className="font-medium tabular-nums">{fmtQtyMt(c.cargoQtyMt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Rate</dt>
            <dd className="font-medium tabular-nums">{fmtRate(c.dischargeRateMtPerDay)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Workable / total hatches</dt>
            <dd className="font-mono font-medium">
              {c.workableHatches != null || c.totalHatches != null
                ? `${c.workableHatches ?? "—"} / ${c.totalHatches ?? "—"}`
                : "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Allowed time source</dt>
            <dd className="text-[11px] font-medium leading-snug">{c.allowedSource}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Contract contact window</dt>
            <dd className="text-[11px] font-medium leading-snug">
              {weekLabel ? (
                <span>
                  Week starts / ends: {weekLabel}. Contact hours each day are inside this window;
                  outside = free time. After allowed laytime is used, weekends and holidays no
                  longer deduct (on demurrage).
                </span>
              ) : c.excludedDays?.length ? (
                <span>Excluded weekdays: {c.excludedDays.join(", ")}</span>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
      </div>
    ) : null;

  const auxiliaryBlock = (
    <>
      <div className="rounded-md border border-border bg-muted/25 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Laytime summary
        </p>
        <dl className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Total qty</dt>
            <dd className="text-sm font-semibold tabular-nums">{fmtQtyMt(c.cargoQtyMt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Discharge rate</dt>
            <dd className="text-sm font-semibold tabular-nums">
              {fmtRate(c.dischargeRateMtPerDay)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Free time</dt>
            <dd className="text-sm font-semibold tabular-nums">
              {freeH != null ? (
                <>
                  {formatDecimalHoursToHMin(freeH)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({formatDecimalHoursToTotalHoursMin(freeH)})
                  </span>
                </>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
        {weekLabel ? (
          <div className="mt-2 rounded border border-primary/15 bg-primary/5 px-2 py-1.5 text-sm">
            <p className="text-[10px] font-medium text-muted-foreground">Contract working week</p>
            <p className="font-medium leading-tight text-foreground">{weekLabel}</p>
            <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
              Zone <span className="font-mono text-foreground">{c.laytimeResolvedTimeZone}</span>
              {resolvedZoneGmt ? <> ({resolvedZoneGmt})</> : null}. Adjust week in contract setup,
              save, then recalculate.
            </p>
          </div>
        ) : (
          <p className="mt-2 text-[10px] text-muted-foreground">
            Zone <span className="font-mono">{c.laytimeResolvedTimeZone}</span>
            {resolvedZoneGmt ? <> ({resolvedZoneGmt})</> : null}.
          </p>
        )}
      </div>

      <div className="rounded-md border border-border/80 bg-card p-3 text-[11px] leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground">How to read the sheet</p>
        <ul className="mt-2 list-inside list-disc space-y-1 marker:text-primary">
          <li>
            <span className="font-medium text-foreground">Contract hrs</span> — overlap of each day
            with the contract working week.
          </li>
          <li>
            <span className="font-medium text-foreground">Count</span> — SOF time in the contact
            window tagged Count (Events table).
          </li>
          <li>
            <span className="font-medium text-foreground">Not count</span> — SOF time in contact
            tagged Not count; Count + Not count = contact. Free time is not split.
          </li>
          <li>
            <span className="font-medium text-foreground">Despatch</span> — allowed − total used +
            cumulative not-to-count.
          </li>
          <li>
            Discharge MT from <span className="font-medium text-foreground">Discharge</span> on this
            SOF.
          </li>
        </ul>
      </div>

      <details className="rounded-md border border-border bg-muted/15 px-3 py-2 text-xs">
        <summary className="cursor-pointer font-medium text-foreground">
          Contract terms (reference)
        </summary>
        <dl className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Allowed source</dt>
            <dd className="font-medium">{c.allowedSource}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Rate unit</dt>
            <dd className="text-[11px] font-medium leading-snug">
              {formatNum(c.dischargeRateUnit)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Demurrage / dispatch (per day)</dt>
            <dd className="font-medium">
              {c.laytimeDemurrageRatePerDay != null
                ? formatMoney(c.laytimeDemurrageRatePerDay, c.currency)
                : "—"}
              {" · "}
              {c.laytimeDispatchRatePerDay != null
                ? formatMoney(c.laytimeDispatchRatePerDay, c.currency)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Time counting (Frac)</dt>
            <dd className="text-[11px] font-medium">
              applied{" "}
              {c.laytimeCountingFractionApplied != null
                ? c.laytimeCountingFractionApplied.toFixed(4).replace(/\.?0+$/, "")
                : "—"}{" "}
              · explicit {c.laytimeCountingFraction != null ? fmt2(c.laytimeCountingFraction) : "—"}{" "}
              · hatches{" "}
              {c.workableHatches != null || c.totalHatches != null
                ? `${c.workableHatches ?? "—"} / ${c.totalHatches ?? "—"}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Excluded weekdays (segment engine)</dt>
            <dd className="text-[11px] font-medium">
              {c.excludedDays?.length ? c.excludedDays.join(", ") : "—"}
            </dd>
          </div>
        </dl>
      </details>
    </>
  );

  const unifiedWorksheet = (
    <section
      id="laytime-worksheet"
      aria-label="Laytime worksheet"
      className="scroll-mt-20 overflow-hidden rounded-md border border-border bg-card shadow-sm"
    >
      <div className="border-b border-border bg-muted/35 px-3 py-2.5 sm:px-4">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">Laytime worksheet</h3>
        <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
          Statement summary (Laytime2000-style), daily ledger, port statement and chronology, then
          SOF segments. Use <span className="font-medium text-foreground">Recalculate</span> to
          refresh all parts.
        </p>
      </div>
      <div className="divide-y divide-border">
        <div className="space-y-1.5 p-2 sm:p-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Part 1 · Laytime statement summary
          </h4>
          {laytimeStatementSummary}
        </div>
        <div className="space-y-1.5 p-2 sm:p-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Part 2 · Daily (contract hours, working, demurrage accrual)
          </h4>
          {dailyTable}
        </div>
        <div className="space-y-1.5 p-2 sm:p-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Part 3 · Port statement &amp; chronology (local day slices, Frac, on demurrage)
          </h4>
          {portStatementAndParams}
          <p className="text-[10px] text-muted-foreground">
            After allowed laytime is used, excluded weekdays can still accrue (once on demurrage,
            always on demurrage).{" "}
            <span className="font-medium text-foreground">Laytime Expires…</span> appears on the
            chronology row where cumulative time reaches the allowance (including mid-row splits).
          </p>
          {chronologyTable ?? (
            <p className="text-[11px] text-muted-foreground">
              Run <span className="font-medium text-foreground">Recalculate</span> to generate the
              chronology grid.
            </p>
          )}
        </div>
        <div className="space-y-1.5 p-2 sm:p-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Part 4 · SOF event segments (BIMCO-style)
          </h4>
          <p className="text-[10px] text-muted-foreground">
            Each row ends at the closing event;{" "}
            <span className="font-medium text-foreground">Used h</span> is laytime credited for that
            segment.
          </p>
          {eventsTable}
        </div>
      </div>
    </section>
  );

  if (!priority) {
    return (
      <div className={cn("space-y-4", className)}>
        {auxiliaryBlock}
        {unifiedWorksheet}
      </div>
    );
  }

  const strip = (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-md border border-dashed border-border/80 bg-muted/20 px-2 py-1.5 text-[11px] text-muted-foreground">
      <span>
        <span className="font-medium text-foreground">Qty</span> {fmtQtyMt(c.cargoQtyMt)}
      </span>
      {c.totalCargoQtyMt != null && c.totalCargoQtyMt > 0 ? (
        <span title="Vessel-call total cargo (MT)">
          <span className="font-medium text-foreground">Total</span> {fmtQtyMt(c.totalCargoQtyMt)}
        </span>
      ) : null}
      {c.partialCargoQtyMt != null && c.partialCargoQtyMt > 0 ? (
        <span title="Partial cargo used for allowance">
          <span className="font-medium text-foreground">Partial</span> {fmtQtyMt(c.partialCargoQtyMt)}
        </span>
      ) : null}
      <span>
        <span className="font-medium text-foreground">Rate</span> {fmtRate(c.dischargeRateMtPerDay)}
      </span>
      <span>
        <span className="font-medium text-foreground">Free</span>{" "}
        {freeH != null ? formatDecimalHoursToHMin(freeH) : "—"}
      </span>
      {weekLabel ? (
        <span className="min-w-0 truncate" title={weekLabel}>
          <span className="font-medium text-foreground">Week</span> {weekLabel}
        </span>
      ) : null}
      {c.laytimeCountingFractionApplied != null &&
      Math.abs(c.laytimeCountingFractionApplied - 1) > 1e-9 ? (
        <span className="font-mono tabular-nums">
          <span className="font-medium text-foreground">Frac</span>{" "}
          {c.laytimeCountingFractionApplied.toFixed(4).replace(/\.?0+$/, "")}
        </span>
      ) : null}
    </div>
  );

  return (
    <section id="laytime-worksheet" className={cn("scroll-mt-20 space-y-2", className)}>
      {dailyTable}
    </section>
  );
}
