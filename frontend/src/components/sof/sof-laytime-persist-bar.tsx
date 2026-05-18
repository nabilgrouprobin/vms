"use client";

import { Calculator, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LaytimeBreakdown, MotherLaytimeDailyLedger } from "@/lib/sof-api";

export type SofLaytimePersistBarProps = {
  readOnly: boolean;
  pending: boolean;
  breakdown: LaytimeBreakdown | null | undefined;
  dailyLedger: MotherLaytimeDailyLedger | null | undefined;
  onSaveLaytime: () => void;
  /** Button label (e.g. Save, Save SOF). */
  saveLabel?: string;
  pendingLabel?: string;
  /** Button only — no helper text (workspace Events / Laytime). */
  minimal?: boolean;
  className?: string;
};

/** Sticky footer: save laytime totals to the SOF record (via recalculate API). */
export function SofLaytimePersistBar({
  readOnly,
  pending,
  onSaveLaytime,
  saveLabel = "Save laytime",
  pendingLabel = "Saving…",
  minimal = false,
  className
}: SofLaytimePersistBarProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 mt-1 rounded-lg border border-border bg-card/95 px-2 py-1.5 shadow-md backdrop-blur-sm",
        className
      )}
    >
      <div
        className={cn(
          "flex gap-2",
          minimal ? "flex-row items-center justify-end" : "flex-col sm:flex-row sm:items-center sm:justify-between"
        )}
      >
        {minimal ? null : (
          <p className="text-[11px] text-muted-foreground">
            Save writes the daily sheet and totals to this SOF.
          </p>
        )}
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
              {pendingLabel}
            </>
          ) : (
            <>
              <Save className="size-3.5" aria-hidden />
              {saveLabel}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
