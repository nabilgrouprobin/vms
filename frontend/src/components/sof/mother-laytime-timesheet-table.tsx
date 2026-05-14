"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { formatDt, formatNum } from "@/lib/format";
import {
  formatDecimalHoursToDaysHMin,
  formatDecimalHoursToHMin,
  formatDecimalHoursToTotalHoursMin
} from "@/lib/laytime-hours-format";
import type {
  LaytimeBreakdown,
  LaytimeChronologyRow,
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

function fmt2(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

export type MotherLaytimeTimesheetLayout = "default" | "priority";

export function MotherLaytimeTimesheetTable({
  dailyLedger,
  timesheet,
  breakdown,
  chronology = [],
  className,
  sheetLayout = "priority"
}: {
  dailyLedger: MotherLaytimeDailyLedger;
  timesheet: MotherLaytimeTimesheet;
  breakdown: LaytimeBreakdown;
  /** Day-split chronology (Laytime2000-style); empty until recalculate returns rows. */
  chronology?: LaytimeChronologyRow[];
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
    <div className="w-full overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[1400px] border-collapse text-xs xl:min-w-[1600px] 2xl:min-w-[1800px]">
        <thead>
          <tr className="border-b border-border bg-muted/60">
            <th className="px-2 py-2 text-left text-[11px] font-semibold text-muted-foreground">
              Date
            </th>
            <th className="px-2 py-2 text-left text-[11px] font-semibold text-muted-foreground">
              Day
            </th>
            <Th title="Hours of each day inside the contract working week — drives laytime ‘used’ vs free time.">
              Contract hrs
            </Th>
            <Th title="Hours from SOF segments that count as discharge / cargo (laytime) activity.">
              Working hrs
            </Th>
            <Th title="24 hours minus working hours on that calendar day (non-discharge / idle).">
              Idle hrs
            </Th>
            <Th title="After free laytime is used, demurrage time accrues per charter rules.">
              Demurrage hrs
            </Th>
            <Th title="24h MT from mother vessel daily discharge (Discharge on this SOF)">
              Discharge qty
            </Th>
            <th className="min-w-[36rem] px-3 py-2 text-left text-[11px] font-semibold text-muted-foreground xl:min-w-[42rem] 2xl:min-w-[48rem]">
              Activity details
            </th>
          </tr>
        </thead>
        <tbody className="[&_td]:border-border [&_tr]:border-b [&_tr]:border-border [&_tr:hover]:bg-muted/20">
          {dailyLedger.rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                No calendar days in range. Set commence / NOR and add events or discharge rows.
              </td>
            </tr>
          ) : (
            dailyLedger.rows.map((r) => (
              <tr key={r.date}>
                <td className="whitespace-nowrap px-2.5 py-1.5 font-mono tabular-nums">{r.date}</td>
                <td className="whitespace-nowrap px-2.5 py-1.5 capitalize">{r.weekday}</td>
                <td className="whitespace-nowrap px-2.5 py-1.5 text-right font-mono tabular-nums">
                  {fmt2(r.contactHour)}
                </td>
                <td className="whitespace-nowrap px-2.5 py-1.5 text-right font-mono tabular-nums">
                  {fmt2(r.workingHour)}
                </td>
                <td className="whitespace-nowrap px-2.5 py-1.5 text-right font-mono tabular-nums">
                  {fmt2(r.idleHour)}
                </td>
                <td className="whitespace-nowrap px-2.5 py-1.5 text-right font-mono tabular-nums">
                  {fmt2(r.demurrageHour)}
                </td>
                <td className="whitespace-nowrap px-2.5 py-1.5 text-right font-mono tabular-nums">
                  {r.dischargeQtyMt !== null ? `${fmt2(r.dischargeQtyMt)} MT` : "—"}
                </td>
                <td className="min-w-[36rem] px-3 py-1.5 align-top text-[11px] leading-snug xl:min-w-[42rem] 2xl:min-w-[48rem]">
                  {r.activityDetails}
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border bg-muted/50 font-semibold">
            <td colSpan={2} className="px-2 py-2 text-[11px] text-muted-foreground">
              Totals
            </td>
            <td className="px-2 py-2 text-right font-mono tabular-nums text-xs">
              {fmt2(dailyLedger.totalContactHour)}
            </td>
            <td className="px-2 py-2 text-right font-mono tabular-nums text-xs">
              {fmt2(dailyLedger.totalWorkingHour)}
            </td>
            <td className="px-2 py-2 text-right font-mono tabular-nums text-xs">
              {fmt2(dailyLedger.totalIdleHour)}
            </td>
            <td className="px-2 py-2 text-right font-mono tabular-nums text-xs">
              {fmt2(dailyLedger.totalDemurrageHour)}
            </td>
            <td className="px-2 py-2 text-right font-mono tabular-nums text-xs">
              {dailyLedger.totalDischargeQtyMt > 0
                ? `${fmt2(dailyLedger.totalDischargeQtyMt)} MT`
                : "—"}
            </td>
            <td />
          </tr>
          <tr className="bg-muted/25 text-[11px]">
            <td colSpan={8} className="px-2 py-1.5 text-muted-foreground">
              <span className="font-medium text-foreground">Laytime used (events + calendar):</span>{" "}
              {formatDecimalHoursToHMin(breakdown.usedHours)}
              {breakdown.allowedHours != null
                ? ` · free ${formatDecimalHoursToDaysHMin(breakdown.allowedHours)} (${formatDecimalHoursToTotalHoursMin(breakdown.allowedHours)})`
                : ""}
              {" · "}
              balance {formatDecimalHoursToHMin(breakdown.balanceHours)} · dispatch time{" "}
              {formatDecimalHoursToHMin(breakdown.dispatchHours)}
            </td>
          </tr>
          <tr className="bg-muted/25 text-[11px]">
            <td colSpan={4} className="px-2 py-1.5 text-muted-foreground">
              Demurrage / dispatch / net
            </td>
            <td className="px-2 py-1.5 text-right font-medium tabular-nums" colSpan={4}>
              {formatMoney(breakdown.demurrageAmount, breakdown.currency)} /{" "}
              {formatMoney(breakdown.dispatchAmount, breakdown.currency)} /{" "}
              {formatMoney(breakdown.netAmount, breakdown.currency)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  const chronologyTable =
    chronology.length === 0 ? null : (
      <div className="w-full overflow-x-auto rounded-md border border-border text-xs">
        <table className="w-full min-w-[900px] border-collapse xl:min-w-[1000px]">
          <thead>
            <tr className="border-b bg-muted/50">
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
                To count
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
            {chronology.map((r, i) => (
              <tr key={`${r.date}-${r.startLocalHm}-${r.endLocalHm}-${i}`} className="border-b">
                <td className="whitespace-nowrap px-2 py-1 capitalize">{r.weekday}</td>
                <td className="whitespace-nowrap px-2 py-1 font-mono">{r.date}</td>
                <td className="whitespace-nowrap px-2 py-1 font-mono">{r.startLocalHm}</td>
                <td className="whitespace-nowrap px-2 py-1 font-mono">{r.endLocalHm}</td>
                <td className="whitespace-nowrap px-2 py-1 text-right font-mono tabular-nums">
                  {r.fraction}
                </td>
                <td className="max-w-[14rem] truncate px-2 py-1 text-[11px]" title={r.remark}>
                  {r.remark}
                </td>
                <td className="whitespace-nowrap px-2 py-1 text-right font-mono text-[11px]">
                  {fmtLaysoftDhm(r.toCountHours)}
                </td>
                <td className="whitespace-nowrap px-2 py-1 text-right font-mono text-[11px]">
                  {fmtLaysoftDhm(r.totalUsedHours)}
                </td>
                <td className="whitespace-nowrap px-2 py-1 text-right font-mono text-[11px]">
                  {fmtLaysoftDhm(r.onDemurrageHours)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

  const eventsTable = (
    <div className="w-full overflow-x-auto rounded-md border border-border text-xs">
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
              <td className="px-2 py-1.5 text-[11px]">{row.remark}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

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
            <span className="font-medium text-foreground">Working hrs</span> — SOF segments that
            count as discharge / laytime activity.
          </li>
          <li>
            <span className="font-medium text-foreground">Idle hrs</span> — 24 h minus working hrs
            on that calendar day.
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

  if (!priority) {
    return (
      <div className={cn("space-y-4", className)}>
        {auxiliaryBlock}
        {dailyTable}
        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs">
              <ChevronDown className="size-3.5 shrink-0 opacity-70" />
              Port chronology (Laytime2000-style)
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {chronologyTable ?? (
              <p className="text-[11px] text-muted-foreground">
                Run recalculate to generate the chronology grid.
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>
        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs">
              <ChevronDown className="size-3.5 shrink-0 opacity-70" />
              SOF event segments
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            <p className="text-[11px] text-muted-foreground">
              Each row ends at the closing SOF event;{" "}
              <span className="font-medium text-foreground">Used h</span> is laytime credited for
              that segment.
            </p>
            {eventsTable}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }

  const strip = (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-md border border-dashed border-border/80 bg-muted/20 px-2 py-1.5 text-[11px] text-muted-foreground">
      <span>
        <span className="font-medium text-foreground">Qty</span> {fmtQtyMt(c.cargoQtyMt)}
      </span>
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
    <div className={cn("space-y-2", className)}>
      {strip}

      <section className="space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Daily laytime calculation
        </h3>
        {dailyTable}
      </section>

      <section className="space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Port chronology (Laytime2000-style)
        </h3>
        <p className="text-[10px] text-muted-foreground">
          Each row is a local calendar slice of an SOF segment. After allowed laytime is consumed,
          excluded weekdays still accrue (once on demurrage, always on demurrage).
        </p>
        {chronologyTable ?? (
          <p className="text-[11px] text-muted-foreground">
            Run <span className="font-medium text-foreground">Recalculate</span> to generate the
            chronology grid.
          </p>
        )}
      </section>

      <section className="space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          SOF event segments
        </h3>
        <p className="text-[10px] text-muted-foreground">
          Each row ends at the closing event;{" "}
          <span className="font-medium text-foreground">Used h</span> is laytime credited for that
          segment.
        </p>
        {eventsTable}
      </section>

      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-full max-w-md justify-between gap-2 text-xs font-normal text-muted-foreground"
          >
            <span>Summary, week detail &amp; legend</span>
            <ChevronDown className="size-3.5 shrink-0 opacity-70" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-3">{auxiliaryBlock}</CollapsibleContent>
      </Collapsible>
    </div>
  );
}
