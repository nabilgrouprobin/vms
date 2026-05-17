"use client";

import { Calculator } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { formatDt } from "@/lib/format";
import { formatDecimalHoursToHMin } from "@/lib/laytime-hours-format";
import type { LaytimeBreakdown } from "@/lib/sof-api";

export type SofDetailLaytimeSheetsStripProps = {
  heading: string;
  /** Shown under the heading before the first successful recalculate. */
  idleHint: ReactNode;
  /** Present after recalculate; drives “Last run…” and the metrics line under the bar. */
  breakdown: LaytimeBreakdown | null | undefined;
  recalculateDisabled: boolean;
  recalculatePending: boolean;
  onRecalculate: () => void;
};

/** Shared laytime tab header: calculator icon, last-run or idle hint, recalculate, optional breakdown line. */
export function SofDetailLaytimeSheetsStrip({
  heading,
  idleHint,
  breakdown,
  recalculateDisabled,
  recalculatePending,
  onRecalculate
}: SofDetailLaytimeSheetsStripProps) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Calculator className="size-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{heading}</p>
            {breakdown ? (
              <p className="truncate text-[11px] text-muted-foreground">
                Last run · commence {formatDt(breakdown.commenceAt)}
                {breakdown.allowedHours != null
                  ? ` · free ${formatDecimalHoursToHMin(breakdown.allowedHours)}`
                  : ""}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">{idleHint}</p>
            )}
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          className="laytime-print-suppress shrink-0 gap-1.5"
          disabled={recalculateDisabled}
          onClick={onRecalculate}
        >
          <Calculator className="size-3.5" aria-hidden />
          {recalculatePending ? "Working…" : "Recalculate"}
        </Button>
      </div>
      {breakdown ? (
        <p className="text-[11px] leading-snug text-muted-foreground">
          {breakdown.allowedSource}
          {" · "}
          contract {formatDecimalHoursToHMin(breakdown.usedHours)} · idle{" "}
          {formatDecimalHoursToHMin(breakdown.excludedHours)} · dem / dispatch{" "}
          {formatDecimalHoursToHMin(breakdown.demurrageHours)} /{" "}
          {formatDecimalHoursToHMin(breakdown.dispatchHours)}
          {breakdown.currency ? ` · ${breakdown.currency}` : ""}
        </p>
      ) : null}
    </>
  );
}
