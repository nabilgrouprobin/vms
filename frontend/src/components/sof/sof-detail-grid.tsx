"use client";

import { cn } from "@/lib/utils";

type SofDetailGridRow = { label: string; value: string };

/** Definition list grid used across mother / lighter SOF overview collapsibles. */
export function SofDetailGrid({
  rows,
  columns = 2,
  dense
}: {
  rows: SofDetailGridRow[];
  columns?: 2 | 3;
  dense?: boolean;
}) {
  return (
    <dl
      className={cn(
        "grid gap-3 text-sm",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        dense && "gap-2 text-xs"
      )}
    >
      {rows.map(({ label, value }) => (
        <div key={label} className="space-y-0.5">
          <dt
            className={cn(
              "text-muted-foreground",
              dense ? "text-[10px] uppercase tracking-wide" : "text-xs"
            )}
          >
            {label}
          </dt>
          <dd className={cn("font-medium break-words", dense && "text-xs")}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
