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

/** Live laytime summary on the Events tab (updates when Count / Not count changes). */
export function SofEventsLaytimePreview({
  pending,
  breakdown,
  dailyLedger,
  className
}: SofEventsLaytimePreviewProps) {
  if (!breakdown && !pending) {
    return (
      <p className={cn("text-[11px] text-muted-foreground", className)}>
        Laytime preview appears after the first calculation. Use{" "}
        <span className="font-medium text-foreground">Save laytime</span> below when finished.
      </p>
    );
  }

  const countH = dailyLedger?.totalToCountHour ?? dailyLedger?.totalWorkingHour;
  const notCountH = dailyLedger?.totalNotToCountHour ?? dailyLedger?.totalIdleHour;
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
        Laytime preview {pending ? "(updating…)" : ""}
      </p>
      {breakdown && dailyLedger ? (
        <div className="mt-1 grid gap-1 font-mono tabular-nums sm:grid-cols-2 lg:grid-cols-4">
          <span>
            Allowed{" "}
            <span className="font-semibold text-foreground">
              {breakdown.allowedHours != null
                ? formatDecimalHoursToHMin(breakdown.allowedHours)
                : "—"}
            </span>
          </span>
          <span>
            Count{" "}
            <span className="font-semibold text-foreground">
              {countH != null ? formatDecimalHoursToHMin(countH) : "—"}
            </span>
          </span>
          <span>
            Not count{" "}
            <span className="font-semibold text-foreground">
              {notCountH != null ? formatDecimalHoursToHMin(notCountH) : "—"}
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
    </div>
  );
}
