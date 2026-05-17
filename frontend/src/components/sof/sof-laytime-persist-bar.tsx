"use client";

import { Calculator, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDecimalHoursToHMin } from "@/lib/laytime-hours-format";
import type { LaytimeBreakdown, MotherLaytimeDailyLedger } from "@/lib/sof-api";
import { cn } from "@/lib/utils";

export type SofLaytimePersistBarProps = {
  readOnly: boolean;
  pending: boolean;
  breakdown: LaytimeBreakdown | null | undefined;
  dailyLedger: MotherLaytimeDailyLedger | null | undefined;
  onSaveLaytime: () => void;
  className?: string;
};

/** Sticky footer: save laytime totals to the SOF record (via recalculate API). */
export function SofLaytimePersistBar({
  readOnly,
  pending,
  breakdown,
  dailyLedger,
  onSaveLaytime,
  className
}: SofLaytimePersistBarProps) {
  const countH = dailyLedger?.totalToCountHour ?? dailyLedger?.totalWorkingHour;
  const notCountH = dailyLedger?.totalNotToCountHour ?? dailyLedger?.totalIdleHour;

  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 -mx-1 mt-3 rounded-lg border border-border bg-card/95 px-3 py-2.5 shadow-md backdrop-blur-sm",
        className
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-0.5 text-[11px] text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Count / Not count</span> on each event
            saves immediately.{" "}
            <span className="font-medium text-foreground">Save laytime</span> writes the daily sheet
            and totals to this SOF.
          </p>
          {breakdown ? (
            <p className="font-mono tabular-nums">
              Count {countH != null ? formatDecimalHoursToHMin(countH) : "—"} · Not count{" "}
              {notCountH != null ? formatDecimalHoursToHMin(notCountH) : "—"} · Balance{" "}
              <span
                className={
                  (breakdown.balanceHours ?? 0) < -0.01
                    ? "font-semibold text-amber-800 dark:text-amber-200"
                    : "text-foreground"
                }
              >
                {formatDecimalHoursToHMin(breakdown.balanceHours)}
              </span>
            </p>
          ) : (
            <p>Run save once after your events and Count / Not count tags are final.</p>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          className="shrink-0 gap-1.5"
          disabled={readOnly || pending}
          onClick={onSaveLaytime}
        >
          {pending ? (
            <>
              <Calculator className="size-3.5 animate-pulse" aria-hidden />
              Saving laytime…
            </>
          ) : (
            <>
              <Save className="size-3.5" aria-hidden />
              Save laytime
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
