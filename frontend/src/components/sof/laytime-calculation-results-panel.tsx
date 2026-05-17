"use client";

import { Copy, Download, Printer } from "lucide-react";
import { useCallback, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatDecimalHoursToDaysHMin,
  formatDecimalHoursToHMin,
  formatDecimalHoursToTotalHoursMin
} from "@/lib/laytime-hours-format";
import { runLaytimeBundlePrint } from "@/lib/laytime-print";
import { toast } from "@/lib/toast";
import type {
  LaytimeBreakdown,
  LaytimePortStatementContext,
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
  portStatement?: LaytimePortStatementContext | null;
  className?: string;
};

export function LaytimeCalculationResultsPanel({
  sofNo,
  breakdown,
  timesheet,
  portStatement,
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

  const summaryText = useMemo(() => {
    if (!breakdown || !c) return "";
    const lines = [
      `SOF ${sofNo}`,
      portStatement?.vesselName ? `Vessel: ${portStatement.vesselName}` : "",
      `Allowed: ${breakdown.allowedHours != null ? formatDecimalHoursToDaysHMin(breakdown.allowedHours) : "—"} (${breakdown.allowedHours != null ? formatDecimalHoursToTotalHoursMin(breakdown.allowedHours) : ""})`,
      `Used (working): ${formatDecimalHoursToDaysHMin(breakdown.usedHours)} (${formatDecimalHoursToTotalHoursMin(breakdown.usedHours)})`,
      `Idle / excluded (segments): ${formatDecimalHoursToHMin(breakdown.excludedHours)}`,
      `Demurrage time: ${formatDecimalHoursToHMin(breakdown.demurrageHours)} · Dispatch time: ${formatDecimalHoursToHMin(breakdown.dispatchHours)}`,
      primaryAmountLine ? `${primaryAmountLine.label}: ${primaryAmountLine.value}` : "",
      breakdown.netAmount != null
        ? `Net: ${formatMoney(breakdown.netAmount, breakdown.currency ?? c.currency)}`
        : ""
    ];
    return lines.filter(Boolean).join("\n");
  }, [breakdown, c, portStatement, primaryAmountLine, sofNo]);

  const downloadCsv = useCallback(() => {
    if (!breakdown || !c) return;
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows: string[][] = [
      ["Field", "Value"],
      ["SOF", sofNo],
      ["Vessel", portStatement?.vesselName ?? ""],
      ["Laytime commence (UTC)", breakdown.commenceAt],
      ["Allowed hours", breakdown.allowedHours != null ? String(breakdown.allowedHours) : ""],
      ["Used hours", String(breakdown.usedHours)],
      ["Excluded hours", String(breakdown.excludedHours)],
      ["Demurrage hours", String(breakdown.demurrageHours)],
      ["Dispatch hours", String(breakdown.dispatchHours)],
      ["Demurrage amount", breakdown.demurrageAmount != null ? String(breakdown.demurrageAmount) : ""],
      ["Dispatch amount", breakdown.dispatchAmount != null ? String(breakdown.dispatchAmount) : ""],
      ["Net amount", breakdown.netAmount != null ? String(breakdown.netAmount) : ""],
      ["Currency", breakdown.currency ?? c.currency ?? ""],
      ["Cargo MT (allowance qty)", c.cargoQtyMt != null ? String(c.cargoQtyMt) : ""],
      ["Total cargo MT", c.totalCargoQtyMt != null ? String(c.totalCargoQtyMt) : ""],
      ["Partial cargo MT (SOF)", c.partialCargoQtyMt != null ? String(c.partialCargoQtyMt) : ""],
      ["Discharge rate", c.dischargeRateMtPerDay != null ? String(c.dischargeRateMtPerDay) : ""]
    ];
    const body = rows.map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sofNo}-laytime-summary.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Laytime summary CSV downloaded.");
  }, [breakdown, c, portStatement?.vesselName, sofNo]);

  const copySummary = useCallback(async () => {
    if (!summaryText) return;
    try {
      await navigator.clipboard.writeText(summaryText);
      toast.success("Summary copied to clipboard.");
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  }, [summaryText]);

  const printWorksheet = useCallback(() => {
    runLaytimeBundlePrint();
  }, []);

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
      <CardHeader className="space-y-3 border-b border-border bg-muted/25 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base font-semibold tracking-tight">
              Laytime calculation — {portStatement?.vesselName ?? sofNo}
            </CardTitle>
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
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
          </div>
        </div>

        <div className="grid gap-3 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Allowed
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums leading-tight">
              {allowed != null ? formatDecimalHoursToTotalHoursMin(allowed) : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {allowed != null ? formatDecimalHoursToDaysHMin(allowed) : "Set in Laytime setup"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Used (contact hrs)
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums leading-tight">
              {formatDecimalHoursToDaysHMin(breakdown.usedHours)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatDecimalHoursToTotalHoursMin(breakdown.usedHours)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {diffLabel}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums leading-tight">
              {diffHours != null ? formatDecimalHoursToDaysHMin(diffHours) : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Balance (allowed − used): {formatDecimalHoursToHMin(breakdown.balanceHours)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <p
              className={cn(
                "mt-1 text-lg font-semibold leading-tight",
                status.tone === "destructive" && "text-destructive",
                status.tone === "success" && "text-emerald-600 dark:text-emerald-400",
                status.tone === "warning" && "text-amber-600 dark:text-amber-400"
              )}
            >
              {status.label}
            </p>
            {primaryAmountLine ? (
              <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                {primaryAmountLine.label}: {primaryAmountLine.value}
              </p>
            ) : (
              <p className="mt-1 text-[10px] text-muted-foreground">No money line (rates or time).</p>
            )}
            {breakdown.netAmount != null && Math.abs(breakdown.netAmount) > 0.005 ? (
              <p className="text-[10px] text-muted-foreground">
                Net due {formatMoney(breakdown.netAmount, breakdown.currency ?? c.currency)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="laytime-print-suppress flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={printWorksheet}>
            <Printer className="size-3.5" aria-hidden />
            Print
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={downloadCsv}>
            <Download className="size-3.5" aria-hidden />
            Export CSV
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => void copySummary()}>
            <Copy className="size-3.5" aria-hidden />
            Copy summary
          </Button>
        </div>
      </CardHeader>

    </Card>
  );
}
