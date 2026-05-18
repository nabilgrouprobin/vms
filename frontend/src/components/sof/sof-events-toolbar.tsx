"use client";

import { ArrowDownUp, Download, FileSpreadsheet, HelpCircle, Printer, Upload } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { downloadSofEventsImportTemplateCsv } from "@/lib/sof-events-csv-template";
import { toast } from "@/lib/toast";
import type { SofEventTypeOption } from "@/types/vms";
import { cn } from "@/lib/utils";

export type SofEventsSortOrder = "newest" | "oldest";

export type SofEventsToolbarProps = {
  sortOrder: SofEventsSortOrder;
  onSortOrderChange: (order: SofEventsSortOrder) => void;
  onExportCsv: () => void;
  onImportCsv: (file: File) => void;
  onPrint: () => void;
  /** Used to pre-fill example event type names in the sample CSV. */
  eventTypeOptions?: SofEventTypeOption[];
  exportDisabled?: boolean;
  importDisabled?: boolean;
  importBusy?: boolean;
  className?: string;
};

const FORMAT_HELP = `Format downloads a CSV template with your current event types listed at the top (# comment lines).

Columns: event_starts_at, event_ends_at, event_type, laytime_count, remarks.
Length is calculated from start to end (no duration column).

Unknown event_type: that row is skipped; other rows still import. Fix the name or add the type in Master data → SOF event types.`;

export function SofSortOrderToggle({
  sortOrder,
  onSortOrderChange,
  className
}: Pick<SofEventsToolbarProps, "sortOrder" | "onSortOrderChange" | "className">) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-border/70 bg-muted/15 px-1 py-0.5",
        className
      )}
    >
      <Button
        type="button"
        variant={sortOrder === "newest" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 gap-1 px-2 text-[11px]"
        onClick={() => onSortOrderChange("newest")}
      >
        <ArrowDownUp className="size-3.5" aria-hidden />
        Newest first
      </Button>
      <Button
        type="button"
        variant={sortOrder === "oldest" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 gap-1 px-2 text-[11px]"
        onClick={() => onSortOrderChange("oldest")}
      >
        Oldest first
      </Button>
    </div>
  );
}

export function SofEventsToolbar({
  sortOrder,
  onSortOrderChange,
  onExportCsv,
  onImportCsv,
  onPrint,
  eventTypeOptions,
  exportDisabled,
  importDisabled,
  importBusy,
  className
}: SofEventsToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-lg border border-border/70 bg-muted/15 px-2 py-1.5",
        className
      )}
    >
      <SofSortOrderToggle sortOrder={sortOrder} onSortOrderChange={onSortOrderChange} className="border-0 bg-transparent p-0" />

      <span className="mx-0.5 hidden h-5 w-px bg-border sm:inline" aria-hidden />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 gap-1 px-2 text-[11px]"
        disabled={exportDisabled}
        onClick={onExportCsv}
      >
        <Download className="size-3.5" aria-hidden />
        Export
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 gap-1 px-2 text-[11px]"
        disabled={importDisabled || importBusy}
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="size-3.5" aria-hidden />
        {importBusy ? "Importing…" : "Import"}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onImportCsv(f);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 gap-1 px-2 text-[11px]"
        title="Download sample CSV template to fill in and import"
        onClick={() => {
          downloadSofEventsImportTemplateCsv({ eventTypeOptions });
          toast.success("Sample CSV downloaded. Fill rows and use Import.", {
            title: "Import template",
            durationMs: 4500
          });
        }}
      >
        <FileSpreadsheet className="size-3.5" aria-hidden />
        Format
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 gap-1 px-2 text-[11px]"
        title="Import column reference"
        onClick={() => {
          toast.info(FORMAT_HELP, { title: "CSV import help", durationMs: 12000 });
        }}
      >
        <HelpCircle className="size-3.5" aria-hidden />
        Help
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 gap-1 px-2 text-[11px]"
        onClick={onPrint}
      >
        <Printer className="size-3.5" aria-hidden />
        Print
      </Button>
    </div>
  );
}
