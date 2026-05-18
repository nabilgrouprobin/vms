"use client";

import {
  computeLaytimeSummaryFigures,
  formatDecimalHoursToLaytimeReport,
  type LaytimeSummaryFigures
} from "@/lib/laytime-summary-calc";
import type { LaytimeBreakdown, MotherLaytimeContractSummary } from "@/lib/sof-api";
import { cn } from "@/lib/utils";

function formatMoney(amount: number | null, currency: string | null): string {
  if (amount === null || !Number.isFinite(amount)) return "—";
  const code = currency && /^[A-Z]{3}$/i.test(currency) ? currency.toUpperCase() : "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${code}`;
  }
}

function SummaryRow({
  label,
  value,
  unit
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <tr className="border-b border-border">
      <td className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </td>
      {unit !== undefined ? (
        <td className="w-24 px-3 py-2 text-center text-[10px] font-medium uppercase text-muted-foreground">
          {unit}
        </td>
      ) : null}
      <td className="px-3 py-2 text-right font-mono text-sm font-semibold tabular-nums text-foreground">
        {value}
      </td>
    </tr>
  );
}

function TimeSummaryBlock({ fig, allowedDisplay }: { fig: LaytimeSummaryFigures; allowedDisplay: string }) {
  return (
    <table className="w-full min-w-[320px] border-collapse text-left">
      <tbody>
        <SummaryRow label="Used laytime" value={formatDecimalHoursToLaytimeReport(fig.usedHours)} />
        <SummaryRow label="Allowed laytime" value={allowedDisplay} />
        <SummaryRow
          label="Minimum allowed laytime"
          value={formatDecimalHoursToLaytimeReport(fig.minimumAllowedHours)}
        />
        <SummaryRow label="Grace time" value={formatDecimalHoursToLaytimeReport(fig.graceHours)} />
        <SummaryRow
          label="Demurrage time"
          value={formatDecimalHoursToLaytimeReport(fig.demurrageTimeHours)}
        />
      </tbody>
    </table>
  );
}

function FinancialSummaryBlock({ fig }: { fig: LaytimeSummaryFigures }) {
  const demDays =
    fig.demurrageTimeHours > 1e-6
      ? fig.demurrageDays.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 8
        })
      : "0.00000000";
  const rate =
    fig.demurrageRatePerDay != null
      ? fig.demurrageRatePerDay.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      : "—";

  return (
    <table className="w-full min-w-[360px] border-collapse border-t border-border text-left">
      <tbody>
        <SummaryRow
          label="Total demurrage time"
          unit="Hours"
          value={formatDecimalHoursToLaytimeReport(fig.demurrageTimeHours)}
        />
        <SummaryRow label="Demurrage days" unit="Days" value={demDays} />
        <SummaryRow label="Demurrage rate" unit="Per day" value={rate} />
        <SummaryRow
          label="Demurrage due"
          unit=""
          value={formatMoney(fig.demurrageDue, fig.currency)}
        />
      </tbody>
    </table>
  );
}

export type LaytimeSummaryTableProps = {
  breakdown: LaytimeBreakdown;
  contract: MotherLaytimeContractSummary;
  minimumAllowedHours?: number | string | null;
  graceHours?: number | string | null;
  className?: string;
};

export function LaytimeSummaryTable({
  breakdown,
  contract,
  minimumAllowedHours,
  graceHours,
  className
}: LaytimeSummaryTableProps) {
  const fig = computeLaytimeSummaryFigures({
    breakdown,
    contract,
    minimumAllowedHours,
    graceHours
  });

  const allowedDisplay =
    fig.allowedHours != null
      ? formatDecimalHoursToLaytimeReport(fig.allowedHours)
      : "—";

  return (
    <section
      aria-label="Laytime summary"
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className
      )}
    >
      <div className="border-b border-border bg-muted/35 px-3 py-2.5 sm:px-4">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">Laytime summary</h3>
        <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
          Used / allowed / demurrage time and amount (report format). Set minimum allowed and grace
          time in the sidebar when needed.
        </p>
      </div>
      <div className="overflow-x-auto p-2 sm:p-3">
        <TimeSummaryBlock fig={fig} allowedDisplay={allowedDisplay} />
        <FinancialSummaryBlock fig={fig} />
        {fig.usesReportAdjustments ? (
          <p className="mt-2 text-[10px] text-muted-foreground">
            Demurrage time uses max(allowed, minimum) minus grace. Demurrage rate is from the
            import contract.
          </p>
        ) : null}
      </div>
    </section>
  );
}
