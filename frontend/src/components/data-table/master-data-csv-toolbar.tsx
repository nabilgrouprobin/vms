"use client";

import type { RefObject } from "react";
import { Download, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MasterDataCsvToolbarProps = {
  className?: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onExport: () => void;
  exportBusy: boolean;
  importBusy: boolean;
  canImport: boolean;
  onImportFileChange: React.ChangeEventHandler<HTMLInputElement>;
  /** Optional primary action (e.g. Add new). */
  extra?: React.ReactNode;
};

/**
 * Styled import / export cluster for master-data (and similar) screens.
 */
export function MasterDataCsvToolbar({
  className,
  fileInputRef,
  onExport,
  exportBusy,
  importBusy,
  canImport,
  onImportFileChange,
  extra
}: MasterDataCsvToolbarProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-end gap-2", className)}>
      <div className="flex items-center rounded-lg border border-border bg-muted/30 p-1 shadow-sm">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2 rounded-md px-3 text-foreground hover:bg-background"
          disabled={exportBusy}
          onClick={() => onExport()}
        >
          <Download className="size-4 shrink-0 opacity-80" aria-hidden />
          {exportBusy ? "Exporting…" : "Export"}
        </Button>
        {canImport ? (
          <>
            <span className="mx-0.5 h-6 w-px bg-border" aria-hidden />
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              aria-hidden
              onChange={onImportFileChange}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 rounded-md px-3 text-foreground hover:bg-background"
              disabled={importBusy}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4 shrink-0 opacity-80" aria-hidden />
              {importBusy ? "Importing…" : "Import"}
            </Button>
          </>
        ) : null}
      </div>
      {extra}
    </div>
  );
}
