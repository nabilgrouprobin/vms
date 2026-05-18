"use client";

import { useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  computeSofCountNotCountSummary,
  formatDurationSpanMs
} from "@/lib/sof-event-display";
import { formatDecimalHoursToHMin } from "@/lib/laytime-hours-format";
import type { MotherLaytimeDailyLedger } from "@/lib/sof-api";
import { cn } from "@/lib/utils";
import type { SofEventListItem } from "@/types/vms";

export type SofEventsCountNotCountSummaryProps = {
  events: SofEventListItem[];
  /** When set (after Recalculate / Save), shows laytime-sheet in-contact totals for comparison. */
  dailyLedger?: MotherLaytimeDailyLedger | null;
  compact?: boolean;
  className?: string;
};

function sumLedgerHours(
  ledger: MotherLaytimeDailyLedger | null | undefined,
  field: "toCountHour" | "notToCountHour" | "sofWallToCountHour" | "sofWallNotToCountHour"
): number {
  if (!ledger?.rows?.length) return 0;
  return ledger.rows.reduce((s, r) => s + (Number(r[field]) || 0), 0);
}

/** Event gap totals vs laytime daily sheet (in contract contact). */
export function SofEventsCountNotCountSummary({
  events,
  dailyLedger,
  compact = false,
  className
}: SofEventsCountNotCountSummaryProps) {
  const summary = useMemo(() => computeSofCountNotCountSummary(events), [events]);

  const inContact = useMemo(() => {
    if (!dailyLedger?.rows?.length) return null;
    return {
      countH: sumLedgerHours(dailyLedger, "toCountHour"),
      notCountH: sumLedgerHours(dailyLedger, "notToCountHour"),
      wallCountH: sumLedgerHours(dailyLedger, "sofWallToCountHour"),
      wallNotCountH: sumLedgerHours(dailyLedger, "sofWallNotToCountHour")
    };
  }, [dailyLedger]);

  if (summary.eventCount === 0) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="py-3 text-xs text-muted-foreground">
          Add events to see Count and Not count time totals.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-border/80 bg-card shadow-sm", className)}>
      <CardContent className={cn("space-y-2", compact ? "px-2 py-2" : "px-3 py-2.5")}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Count / Not count (event gaps — all hours)
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Count" value={formatDurationSpanMs(summary.countMs)} tone="count" />
          <Metric
            label="Not count"
            value={formatDurationSpanMs(summary.notCountMs)}
            tone="notCount"
          />
          <Metric label="Total" value={formatDurationSpanMs(summary.totalTaggedMs)} tone="total" />
        </div>

        {inContact ? (
          <div className="rounded-md border border-primary/20 bg-primary/5 px-2 py-1.5">
            <p className="text-[10px] font-semibold text-foreground">
              Laytime sheet (in contract contact)
            </p>
            <p className="mt-0.5 font-mono text-[11px] tabular-nums text-foreground">
              Count {formatDecimalHoursToHMin(inContact.countH)}
              <span className="text-muted-foreground"> · </span>
              Not count {formatDecimalHoursToHMin(inContact.notCountH)}
            </p>
            {Math.abs(inContact.wallNotCountH - inContact.notCountH) > 0.05 ||
            Math.abs(inContact.wallCountH - inContact.countH) > 0.05 ? (
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                SOF on each calendar day: Count {formatDecimalHoursToHMin(inContact.wallCountH)},
                Not count {formatDecimalHoursToHMin(inContact.wallNotCountH)}. Laytime maps not-count
                time into the contact window (Count + Not count = Contract per day).
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-[10px] leading-snug text-muted-foreground">
            Open <span className="font-medium text-foreground">Laytime</span> and click{" "}
            <span className="font-medium text-foreground">Recalculate</span> to compare with the
            daily sheet.
          </p>
        )}

        {compact ? null : (
          <p className="text-[10px] leading-snug text-muted-foreground">
            Event gaps use each row&apos;s Count / Not count tag (full timeline). The laytime table
            uses the contract contact window (e.g. Sunday from 08:00) — Count + Not count = Contract
            each day.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "count" | "notCount" | "total";
}) {
  return (
    <div
      className={cn(
        "rounded-md border px-2 py-1.5",
        tone === "count" && "border-emerald-500/30 bg-emerald-500/10",
        tone === "notCount" && "border-border bg-muted/30",
        tone === "total" && "border-primary/25 bg-primary/5"
      )}
    >
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-sm font-semibold tabular-nums leading-tight",
          tone === "count" && "text-emerald-800 dark:text-emerald-200",
          tone === "notCount" && "text-foreground",
          tone === "total" && "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}
