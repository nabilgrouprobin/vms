"use client";

import { Copy, Download, Printer } from "lucide-react";
import { useCallback, useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  formatDecimalHoursToDaysHMin,
  formatDecimalHoursToHMin,
  formatDecimalHoursToTotalHoursMin
} from "@/lib/laytime-hours-format";
import { downloadLaytimeCalculationCsv } from "@/lib/laytime-csv-export";
import { runLaytimeBundlePrint } from "@/lib/laytime-print";
import { toast } from "@/lib/toast";
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

const EPS = 1e-4;

export type LaytimeResultsActionsProps = {
  sofNo: string;
  breakdown: LaytimeBreakdown | null;
  timesheet: MotherLaytimeTimesheet | null;
  dailyLedger?: MotherLaytimeDailyLedger | null;
  chronology?: LaytimeChronologyRow[];
  portStatement?: LaytimePortStatementContext | null;
  showCopySummary?: boolean;
  className?: string;
};

export function LaytimeResultsActions({
  sofNo,
  breakdown,
  timesheet,
  dailyLedger,
  chronology = [],
  portStatement,
  showCopySummary = true,
  className
}: LaytimeResultsActionsProps) {
  const c = timesheet?.contractSummary;

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
      primaryAmountLine ? `${primaryAmountLine.label}: ${primaryAmountLine.value}` : ""
    ];
    return lines.filter(Boolean).join("\n");
  }, [breakdown, c, portStatement?.vesselName, primaryAmountLine, sofNo]);

  const canExportFull =
    breakdown != null && timesheet != null && (dailyLedger?.rows?.length ?? 0) > 0;

  const downloadCsv = useCallback(() => {
    if (!breakdown || !timesheet || !dailyLedger?.rows?.length) {
      toast.error("Recalculate laytime first to export the daily calculation table.");
      return;
    }
    downloadLaytimeCalculationCsv({
      sofNo,
      breakdown,
      timesheet,
      dailyLedger,
      portStatement: portStatement ?? undefined,
      chronology
    });
    toast.success("Laytime calculation CSV downloaded (summary + daily table + segments).");
  }, [breakdown, chronology, dailyLedger, portStatement, sofNo, timesheet]);

  const copySummary = useCallback(async () => {
    if (!summaryText) return;
    try {
      await navigator.clipboard.writeText(summaryText);
      toast.success("Summary copied to clipboard.");
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  }, [summaryText]);

  if (!breakdown || !c) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-lg border border-border/70 bg-muted/15 px-2 py-1.5",
        className
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 gap-1 px-2 text-[11px]"
        onClick={() => runLaytimeBundlePrint()}
      >
        <Printer className="size-3.5" aria-hidden />
        Print
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 gap-1 px-2 text-[11px]"
        disabled={!canExportFull}
        title={
          canExportFull
            ? "Download summary, daily calculation table, SOF segments, and chronology"
            : "Run Recalculate to generate the daily table first"
        }
        onClick={downloadCsv}
      >
        <Download className="size-3.5" aria-hidden />
        Export CSV
      </Button>
      {showCopySummary ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-[11px]"
          onClick={() => void copySummary()}
        >
          <Copy className="size-3.5" aria-hidden />
          Copy summary
        </Button>
      ) : null}
    </div>
  );
}
