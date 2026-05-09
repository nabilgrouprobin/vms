"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  mergeLocalDatetimeParts,
  parseHourMinute24Input,
  splitLocalDatetimeInput
} from "@/lib/sof-event-display";
import { cn } from "@/lib/utils";

export type SofLocalDatetimeInputsProps = {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  className?: string;
  dateInputClassName?: string;
  timeInputClassName?: string;
};

/**
 * Local date + explicit 24-hour time (`HH:mm` text). Avoids native `type="time"` / `datetime-local`
 * pickers that often show 12-hour or AM/PM depending on OS/browser.
 */
export function SofLocalDatetimeInputs({
  value,
  onChange,
  disabled,
  className,
  dateInputClassName,
  timeInputClassName
}: SofLocalDatetimeInputsProps) {
  const { date, time } = splitLocalDatetimeInput(value);
  const [timeDraft, setTimeDraft] = useState(time);

  useEffect(() => {
    setTimeDraft(time);
  }, [value, time]);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Input
        type="date"
        disabled={disabled}
        className={cn("w-[11rem] min-h-10 font-mono text-sm tabular-nums", dateInputClassName)}
        value={date}
        onChange={(e) => onChange(mergeLocalDatetimeParts(e.target.value, time))}
      />
      <span className="select-none text-xs text-muted-foreground" aria-hidden>
        ·
      </span>
      <Input
        type="text"
        disabled={disabled || !date}
        className={cn("w-[6.25rem] min-h-10 font-mono text-sm tabular-nums", timeInputClassName)}
        value={date ? timeDraft : ""}
        placeholder="HH:mm"
        title="24-hour time only (no AM/PM), e.g. 09:00 or 17:30"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        maxLength={5}
        aria-label="Time, 24-hour HH:mm"
        onChange={(e) => {
          const next = e.target.value.replace(/[^\d:]/g, "").slice(0, 5);
          setTimeDraft(next);
          if (!date) return;
          const instant =
            /^\d{2}:\d{2}$/.test(next) || /^\d{4}$/.test(next) ? parseHourMinute24Input(next) : null;
          if (instant) {
            setTimeDraft(instant);
            onChange(mergeLocalDatetimeParts(date, instant));
          }
        }}
        onBlur={() => {
          if (!date) return;
          const parsed = parseHourMinute24Input(timeDraft);
          if (parsed) {
            setTimeDraft(parsed);
            onChange(mergeLocalDatetimeParts(date, parsed));
          } else {
            setTimeDraft(time);
          }
        }}
      />
    </div>
  );
}
