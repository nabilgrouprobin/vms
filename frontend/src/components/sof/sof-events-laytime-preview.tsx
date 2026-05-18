"use client";

import { formatDecimalHoursToHMin } from "@/lib/laytime-hours-format";
import type { LaytimeBreakdown, MotherLaytimeDailyLedger } from "@/lib/sof-api";
import { cn } from "@/lib/utils";

export type SofEventsLaytimePreviewProps = {
  pending: boolean;
  breakdown: LaytimeBreakdown | null | undefined;
  dailyLedger: MotherLaytimeDailyLedger | null | undefined;
  className?: string;
};

/** Charter laytime snapshot on the Events tab (after recalculate). */
export function SofEventsLaytimePreview({
  pending,
  breakdown,
  dailyLedger,
  className
}: SofEventsLaytimePreviewProps) {
  if (!breakdown && !pending) {
    return (
      <p className={cn("text-[11px] text-muted-foreground", className)}>
        Charter laytime appears after the first calculation. Use{" "}
        <span className="font-medium text-foreground">Save laytime</span> when finished.
      </p>
    );
  }

  const demH = dailyLedger?.totalDemurrageHour;

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-muted/20 px-3 py-2 text-[11px]",
        pending && "opacity-70",
        className
      )}
    >
      <p className="font-semibold text-foreground">
        Charter laytime {pending ? "(updating…)" : ""}
      </p>
      {breakdown ? (
        <div className="mt-1 grid gap-1 font-mono tabular-nums sm:grid-cols-3">
          <span>
            Allowed{" "}
            <span className="font-semibold text-foreground">
              {breakdown.allowedHours != null
                ? formatDecimalHoursToHMin(breakdown.allowedHours)
                : "—"}
            </span>
          </span>
          <span>
            Balance{" "}
            <span
              className={cn(
                "font-semibold",
                (breakdown.balanceHours ?? 0) < -0.01
                  ? "text-amber-900 dark:text-amber-100"
                  : "text-foreground"
              )}
            >
              {formatDecimalHoursToHMin(breakdown.balanceHours)}
            </span>
          </span>
          <span>
            Demurrage{" "}
            <span className="font-semibold text-amber-900 dark:text-amber-100">
              {demH != null ? formatDecimalHoursToHMin(demH) : "—"}
            </span>
          </span>
        </div>
      ) : null}
      <p className="mt-1 text-[10px] text-muted-foreground">
        Uses contract week, contact, and holidays. Raw Count / Not count totals are above the
        events table.
      </p>
    </div>
  );
}
