"use client";

import { Calculator } from "lucide-react";
import { useMemo } from "react";

import { LaytimeResultsActions } from "@/components/sof/laytime-results-actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatDecimalHoursToDaysHMin,
  formatDecimalHoursToHMin,
  formatDecimalHoursToTotalHoursMin
} from "@/lib/laytime-hours-format";
import type {
  LaytimeBreakdown,
  LaytimeChronologyRow,
  LaytimePortStatementContext,
  MotherLaytimeDailyLedger,
  MotherLaytimeTimesheet
} from "@/lib/sof-api";
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

const EPS = 1e-4;

export type LaytimeCalculationResultsPanelProps = {
  sofNo: string;
  breakdown: LaytimeBreakdown | null;
  timesheet: MotherLaytimeTimesheet | null;
  dailyLedger?: MotherLaytimeDailyLedger | null;
  chronology?: LaytimeChronologyRow[];
  portStatement?: LaytimePortStatementContext | null;
  /** Workspace laytime: hide duplicate vessel title and header action row. */
  compact?: boolean;
  recalculateDisabled?: boolean;
  recalculatePending?: boolean;
  onRecalculate?: () => void;
  className?: string;
};

export function LaytimeCalculationResultsPanel({
  sofNo,
  breakdown,
  timesheet,
  dailyLedger,
  chronology = [],
  portStatement,
  compact = false,
  recalculateDisabled,
  recalculatePending,
  onRecalculate,
  className
}: LaytimeCalculationResultsPanelProps) {
  const c = timesheet?.contractSummary;

  const status = useMemo(() => {
    if (!breakdown) return { label: "—", tone: "muted" as const };
    if (breakdown.allowedHours == null)
      return { label: "Incomplete setup", tone: "warning" as const };
    if (breakdown.demurrageHours > EPS)
      return { label: "Demurrage", tone: "destructive" as const };
    if (breakdown.dispatchHours > EPS)
      return { label: "Despatch", tone: "success" as const };
    return { label: "On time", tone: "default" as const };
  }, [breakdown]);

  const primaryAmountLine = useMemo(() => {
    if (!breakdown) return null;
    if (breakdown.demurrageHours > EPS && breakdown.demurrageAmount != null) {
      return {
        label: "Demurrage due",
        value: formatMoney(breakdown.demurrageAmount, breakdown.currency ?? c?.currency ?? null)
      };
    }
    if (breakdown.dispatchHours > EPS && breakdown.dispatchAmount != null) {
      return {
        label: "Despatch credit",
        value: formatMoney(breakdown.dispatchAmount, breakdown.currency ?? c?.currency ?? null)
      };
    }
    if (breakdown.netAmount != null && Math.abs(breakdown.netAmount) > 0.005) {
      return {
        label: "Net position",
        value: formatMoney(breakdown.netAmount, breakdown.currency ?? c?.currency ?? null)
      };
    }
    return null;
  }, [breakdown, c?.currency]);

  if (!breakdown || !c) {
    return (
      <Card id="laytime-results" className={cn("border-dashed", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Laytime calculation results</CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Set cargo and discharge rate in <span className="font-medium text-foreground">Laytime setup</span>,
            then <span className="font-medium text-foreground">Recalculate</span>.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const allowed = breakdown.allowedHours;

  const diffHours =
    allowed != null ? Math.abs(breakdown.usedHours - allowed) : null;
  const diffLabel =
    breakdown.demurrageHours > EPS
      ? "Excess (demurrage time)"
      : breakdown.dispatchHours > EPS
        ? "Time saved (despatch)"
        : "Difference";

  return (
    <Card
      id="laytime-results"
      className={cn("laytime-print-avoid-break overflow-hidden shadow-sm", className)}
    >
      <CardHeader
        className={cn(
          "border-b border-border bg-muted/25",
          compact ? "space-y-2 px-3 py-2" : "space-y-3 pb-4"
        )}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-0.5">
            <CardTitle
              className={cn("font-semibold tracking-tight", compact ? "text-sm" : "text-base")}
            >
              {compact ? "Laytime results" : `Laytime calculation — ${portStatement?.vesselName ?? sofNo}`}
            </CardTitle>
            {!compact ? (
              <CardDescription className="text-xs">
                {portStatement?.voyageLine ? (
                  <span className="text-muted-foreground">{portStatement.voyageLine}</span>
                ) : (
                  <span className="font-mono text-muted-foreground">{sofNo}</span>
                )}
                {portStatement?.portName ? (
                  <span className="text-muted-foreground"> · {portStatement.portName}</span>
                ) : null}
              </CardDescription>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {compact && onRecalculate ? (
              <Button
                type="button"
                size="sm"
                className="laytime-print-suppress h-8 gap-1.5"
                disabled={recalculateDisabled}
                onClick={onRecalculate}
              >
                <Calculator className="size-3.5" aria-hidden />
                {recalculatePending ? "Working…" : "Recalculate"}
              </Button>
            ) : null}
            {!compact ? (
            <nav
              className="laytime-print-suppress flex flex-wrap gap-1.5 text-[11px]"
              aria-label="Laytime page sections"
            >
              <a
                href="#laytime-results"
                className="rounded-md border border-border bg-card px-2 py-1 font-medium text-foreground hover:bg-muted"
              >
                Results
              </a>
              <a
                href="#laytime-worksheet"
                className="rounded-md border border-transparent px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Daily sheet
              </a>
            </nav>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            "grid gap-2 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card sm:grid-cols-2 lg:grid-cols-4",
            compact ? "p-2.5" : "gap-3 p-4"
          )}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Allowed
            </p>
            <p
              className={cn(
                "mt-0.5 font-semibold tabular-nums leading-tight",
                compact ? "text-base" : "text-lg"
              )}
            >
              {allowed != null ? formatDecimalHoursToTotalHoursMin(allowed) : "—"}
            </p>
            {!compact ? (
              <p className="text-[10px] text-muted-foreground">
                {allowed != null ? formatDecimalHoursToDaysHMin(allowed) : "Set in Laytime setup"}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Used (contact hrs)
            </p>
            <p
              className={cn(
                "mt-0.5 font-semibold tabular-nums leading-tight",
                compact ? "text-base" : "text-lg"
              )}
            >
              {formatDecimalHoursToDaysHMin(breakdown.usedHours)}
            </p>
            {!compact ? (
              <p className="text-[10px] text-muted-foreground">
                {formatDecimalHoursToTotalHoursMin(breakdown.usedHours)}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {diffLabel}
            </p>
            <p
              className={cn(
                "mt-0.5 font-semibold tabular-nums leading-tight",
                compact ? "text-base" : "text-lg"
              )}
            >
              {diffHours != null ? formatDecimalHoursToDaysHMin(diffHours) : "—"}
            </p>
            {!compact ? (
              <p className="text-[10px] text-muted-foreground">
                Balance (allowed − used): {formatDecimalHoursToHMin(breakdown.balanceHours)}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <p
              className={cn(
                "mt-0.5 font-semibold leading-tight",
                compact ? "text-base" : "text-lg",
                status.tone === "destructive" && "text-destructive",
                status.tone === "success" && "text-emerald-600 dark:text-emerald-400",
                status.tone === "warning" && "text-amber-600 dark:text-amber-400"
              )}
            >
              {status.label}
            </p>
            {!compact && primaryAmountLine ? (
              <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                {primaryAmountLine.label}: {primaryAmountLine.value}
              </p>
            ) : !compact ? (
              <p className="mt-1 text-[10px] text-muted-foreground">No money line (rates or time).</p>
            ) : null}
            {!compact &&
            breakdown.netAmount != null &&
            Math.abs(breakdown.netAmount) > 0.005 ? (
              <p className="text-[10px] text-muted-foreground">
                Net due {formatMoney(breakdown.netAmount, breakdown.currency ?? c.currency)}
              </p>
            ) : null}
          </div>
        </div>

        {!compact ? (
          <LaytimeResultsActions
            className="laytime-print-suppress border-0 bg-transparent p-0"
            sofNo={sofNo}
            breakdown={breakdown}
            timesheet={timesheet}
            dailyLedger={dailyLedger}
            chronology={chronology}
            portStatement={portStatement}
          />
        ) : null}
      </CardHeader>

    </Card>
  );
}
