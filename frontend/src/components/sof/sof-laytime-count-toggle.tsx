"use client";

import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

export type SofLaytimeCountToggleProps = {
  value: boolean;
  onChange: (countsAsLaytime: boolean) => void;
  disabled?: boolean;
  /** Compact pill for event table rows (laytime sheet density). */
  variant?: "default" | "table";
  className?: string;
};

/** Per-event laytime tag — styled like laytime sheet contact / muted cells. */
export function SofLaytimeCountToggle({
  value,
  onChange,
  disabled,
  variant = "default",
  className
}: SofLaytimeCountToggleProps) {
  const isTable = variant === "table";

  return (
    <div
      className={cn(
        "inline-flex items-stretch rounded-md border border-border/80 bg-muted/15 shadow-sm",
        isTable && "rounded-full p-px shadow-inner",
        !isTable && "p-0.5",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      role="group"
      aria-label="Laytime count"
    >
      <button
        type="button"
        disabled={disabled}
        title="Count — hours in contact window count on the laytime sheet"
        className={cn(
          "inline-flex items-center justify-center gap-0.5 font-semibold transition-all duration-200",
          isTable
            ? "rounded-full px-3 py-1 text-[11px] leading-tight"
            : "rounded px-2.5 py-1 text-xs",
          value
            ? isTable
              ? "bg-emerald-600 text-white shadow-sm dark:bg-emerald-600"
              : "bg-emerald-600 text-white shadow-sm dark:bg-emerald-600"
            : isTable
              ? "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
        aria-pressed={value}
        onClick={() => onChange(true)}
      >
        {isTable ? (
          <>
            <Check className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
            <span>Count</span>
          </>
        ) : (
          "Count"
        )}
      </button>
      <button
        type="button"
        disabled={disabled}
        title="Not count — excluded from laytime to-count; still fills contact on sheet"
        className={cn(
          "inline-flex items-center justify-center gap-0.5 font-semibold transition-all duration-200",
          isTable
            ? "rounded-full px-3 py-1 text-[11px] leading-tight"
            : "rounded px-2.5 py-1 text-xs",
          !value
            ? isTable
              ? "bg-muted-foreground/25 text-foreground shadow-sm dark:bg-muted-foreground/30"
              : "bg-muted-foreground/20 text-foreground shadow-sm"
            : isTable
              ? "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
        aria-pressed={!value}
        onClick={() => onChange(false)}
      >
        {isTable ? (
          <>
            <Minus className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
            <span>Not count</span>
          </>
        ) : (
          "Not count"
        )}
      </button>
    </div>
  );
}
