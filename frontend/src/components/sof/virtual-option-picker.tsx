"use client";

import { List } from "react-window";

import { cn } from "@/lib/utils";

export type OptionRow = {
  id: string;
  label: string;
  description?: string;
  availability?: "free" | "used";
};

type RowCtx = {
  items: OptionRow[];
  onPick: (id: string) => void;
  selectedId: string | null;
};

function OptionRow({
  ariaAttributes,
  index,
  style,
  items,
  onPick,
  selectedId
}: {
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
  index: number;
  style: React.CSSProperties;
} & RowCtx) {
  const item = items[index];
  if (!item) return null;
  return (
    <div {...ariaAttributes} style={style} className="box-border px-0">
      <button
        type="button"
        className={cn(
          "flex h-full w-full flex-col items-start justify-center border-b border-border px-3 text-left text-sm hover:bg-accent",
          item.availability === "free" && "bg-emerald-500/5",
          item.availability === "used" && "bg-amber-500/5",
          selectedId === item.id && "bg-accent"
        )}
        onClick={() => onPick(item.id)}
      >
        <span className="font-medium leading-tight">{item.label}</span>
        {item.availability ? (
          <span
            className={cn(
              "mt-0.5 inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              item.availability === "free"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
            )}
          >
            {item.availability === "free" ? "Free" : "In use"}
          </span>
        ) : null}
        {item.description ? (
          <span className="text-xs text-muted-foreground leading-tight">{item.description}</span>
        ) : null}
      </button>
    </div>
  );
}

export function VirtualOptionPicker({
  items,
  onPick,
  selectedId,
  height = 240,
  emptyHint
}: {
  items: OptionRow[];
  onPick: (id: string) => void;
  selectedId: string | null;
  height?: number;
  emptyHint?: string;
}) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{emptyHint ?? "No matches"}</p>
    );
  }

  return (
    <List
      style={{ height, width: "100%" }}
      rowHeight={52}
      rowCount={items.length}
      rowProps={{ items, onPick, selectedId }}
      rowComponent={OptionRow}
    />
  );
}
