"use client";

import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDt } from "@/lib/format";
import {
  computeSofTimeSummary,
  formatDurationSpanMs,
  type SofTimeSummary
} from "@/lib/sof-event-display";
import type { SofEventListItem } from "@/types/vms";

type SofEventsTimeSummaryProps = {
  events: SofEventListItem[];
  /**
   * When true, gap-detection upstream is suppressed (more pages remain
   * unloaded). We hide the "Unaccounted (gap)" metric in that case to
   * avoid showing a misleading number based on partial data.
   */
  hasUnloadedHistory?: boolean;
  className?: string;
};

/**
 * Standard SOF (Statement of Facts) time-summary panel.
 *
 * The numbers come from the pure `computeSofTimeSummary` helper, which
 * applies the closing-event rule used by every BIMCO-style laytime sheet:
 *
 *   first  = events[0].eventTime
 *   last   = events[N-1].eventTime
 *   total  = last - first
 *
 *   For each consecutive pair (i, i+1):
 *       Δt(i, i+1) = events[i+1].eventTime - events[i].eventTime
 *       if events[i+1].category == HOLD_DELAY → hold += Δt
 *       else                                  → working += Δt
 *
 *   unaccounted = Σ gap durations (explicit-duration events that don't touch)
 *
 * Money (allowed / demurrage / dispatch / amounts) is computed server-side
 * on the Laytime tab; this panel only surfaces what the events themselves
 * say so the user can sanity-check the input before recalculating.
 */
export function SofEventsTimeSummary({
  events,
  hasUnloadedHistory = false,
  className
}: SofEventsTimeSummaryProps) {
  const summary: SofTimeSummary = useMemo(() => computeSofTimeSummary(events), [events]);

  if (summary.eventCount === 0) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="py-4 text-sm text-muted-foreground">
          No events yet — add events to see the SOF time breakdown.
        </CardContent>
      </Card>
    );
  }

  const showGap = !hasUnloadedHistory;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">SOF time summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCell
            label="Total period"
            value={formatDurationSpanMs(summary.totalSpanMs)}
            sub={
              summary.firstEventIso && summary.lastEventIso
                ? `${formatDt(summary.firstEventIso)} → ${formatDt(summary.lastEventIso)}`
                : undefined
            }
          />
          <SummaryCell
            label="Working (laytime)"
            value={formatDurationSpanMs(summary.workingMs)}
            tone="ok"
            sub="closing event = Normal"
          />
          <SummaryCell
            label="Hold (excluded)"
            value={formatDurationSpanMs(summary.holdMs)}
            tone="warn"
            sub="closing event = Hold/Delay"
          />
          <SummaryCell
            label={showGap ? "Unaccounted (gaps)" : "Unaccounted (n/a)"}
            value={showGap ? formatDurationSpanMs(summary.unaccountedGapMs) : "—"}
            tone={showGap && summary.unaccountedGapMs > 0 ? "bad" : "muted"}
            sub={showGap ? "explicit-duration gaps in red" : "load more events to compute"}
          />
        </div>

        {summary.unclassifiedMs > 0 ? (
          <p className="text-[11px] leading-snug text-amber-600">
            {formatDurationSpanMs(summary.unclassifiedMs)} of period had no event-type category
            (legacy data). Edit those events to set Normal or Hold so laytime is precise.
          </p>
        ) : null}

        <p className="text-[11px] leading-snug text-muted-foreground">
          <span className="font-medium text-foreground">Standard formula</span> — between any two
          consecutive events, the elapsed time is credited to{" "}
          <span className="font-medium text-foreground">Working</span> when the later event is
          Normal, or <span className="font-medium text-foreground">Hold</span> when it is a
          Hold/Delay type. <span className="font-medium text-foreground">Used laytime</span> ={" "}
          Working. <span className="font-medium text-foreground">Excluded</span> = Hold. The
          Laytime tab combines this with the charter party (free time / demurrage / dispatch rate)
          to compute money.
        </p>
      </CardContent>
    </Card>
  );
}

type SummaryTone = "ok" | "warn" | "bad" | "muted" | "neutral";

function SummaryCell({
  label,
  value,
  sub,
  tone = "neutral"
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: SummaryTone;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-base font-semibold leading-tight",
          tone === "ok" && "text-emerald-600 dark:text-emerald-400",
          tone === "warn" && "text-amber-600 dark:text-amber-400",
          tone === "bad" && "text-destructive",
          tone === "muted" && "text-muted-foreground"
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
