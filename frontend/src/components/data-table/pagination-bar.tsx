"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PaginationBarProps = {
  className?: string;
  pageIndex: number;
  totalPages?: number;
  pageSize: number;
  pageSizeOptions?: readonly number[];
  onPageSizeChange: (size: number) => void;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  /** Human-readable range, e.g. from `useCursorBackedPagination` or built from offset pagination. */
  summary: string;
  isBusy?: boolean;
};

/**
 * Reusable footer for paged tables. Works with `useOffsetPagination` or `useCursorBackedPagination`.
 */
export function PaginationBar({
  className,
  pageIndex,
  totalPages,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  canPrev,
  canNext,
  onPrev,
  onNext,
  summary,
  isBusy
}: PaginationBarProps) {
  const pageDisplay = totalPages != null ? `Page ${pageIndex + 1} of ${totalPages}` : `Page ${pageIndex + 1}`;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border bg-muted/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        className
      )}
    >
      <p className="min-w-0 text-sm text-muted-foreground">{summary}</p>
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="whitespace-nowrap">Rows per page</span>
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className="hidden text-sm text-muted-foreground sm:inline">{pageDisplay}</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            disabled={!canPrev || isBusy}
            onClick={onPrev}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            disabled={!canNext || isBusy}
            onClick={onNext}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
