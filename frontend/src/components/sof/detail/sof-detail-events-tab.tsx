"use client";

import { Plus } from "lucide-react";
import { useCallback, useRef, useState, type ReactNode } from "react";

import { SofEventsCountNotCountSummary } from "@/components/sof/sof-events-count-not-count-summary";
import { SofEventsLaytimePreview } from "@/components/sof/sof-events-laytime-preview";
import { SofEventsTable } from "@/components/sof/sof-events-table";
import {
  SofEventsToolbar,
  type SofEventsSortOrder
} from "@/components/sof/sof-events-toolbar";
import { SofLaytimePersistBar } from "@/components/sof/sof-laytime-persist-bar";
import {
  SofWorkspaceVesselHeading,
  type SofWorkspaceVesselHeadingProps
} from "@/components/sof/sof-workspace-vessel-heading";
import { Button } from "@/components/ui/button";
import type { LaytimeBreakdown, MotherLaytimeDailyLedger } from "@/lib/sof-api";
import type { SofEventListItem, SofEventTypeOption } from "@/types/vms";

export type SofDetailEventsTabPagination = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
};

/** Optional pre-fill passed to `onAddEvent` (e.g. when filling a gap row). */
export type SofAddEventPrefill = {
  startIso?: string | null;
  endIso?: string | null;
};

type SofDetailEventsTabProps = {
  contextPanel: ReactNode;
  vesselHeading?: SofWorkspaceVesselHeadingProps | null;
  addEventDisabled: boolean;
  onAddEvent: (prefill?: SofAddEventPrefill) => void;
  events: SofEventListItem[];
  eventTypeOptions: SofEventTypeOption[];
  readOnly: boolean;
  eventsQueryKey: readonly unknown[];
  eventsCsvBasename: string;
  showStatusColumn?: boolean;
  onEventsChanged?: () => void | Promise<void>;
  onImportCsv?: (file: File) => void | Promise<void>;
  importBusy?: boolean;
  pagination: SofDetailEventsTabPagination;
  laytimeRecalcPending?: boolean;
  laytimeBreakdown?: LaytimeBreakdown | null;
  laytimeDailyLedger?: MotherLaytimeDailyLedger | null;
  onSaveLaytime?: () => void;
  fillGapPreparing?: boolean;
  compactChrome?: boolean;
};

/** Shared layout: vessel title, toolbar, events table with infinite footer. */
export function SofDetailEventsTab({
  contextPanel,
  vesselHeading,
  addEventDisabled,
  onAddEvent,
  events,
  eventTypeOptions,
  readOnly,
  eventsQueryKey,
  eventsCsvBasename,
  showStatusColumn = false,
  onEventsChanged,
  onImportCsv,
  importBusy,
  pagination,
  fillGapPreparing,
  laytimeRecalcPending = false,
  laytimeBreakdown,
  laytimeDailyLedger,
  onSaveLaytime,
  compactChrome = false
}: SofDetailEventsTabProps) {
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = pagination;
  const [sortOrder, setSortOrder] = useState<SofEventsSortOrder>("newest");
  const exportCsvRef = useRef<() => void>(() => {});

  const handlePrint = useCallback(() => {
    document.documentElement.classList.add("print-events-mode");
    window.print();
    window.setTimeout(() => document.documentElement.classList.remove("print-events-mode"), 500);
  }, []);

  return (
    <div className={compactChrome ? "space-y-2" : "space-y-3"}>
      {vesselHeading ? (
        <SofWorkspaceVesselHeading {...vesselHeading} compact={compactChrome} />
      ) : null}
      {compactChrome ? null : contextPanel}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SofEventsToolbar
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          onExportCsv={() => exportCsvRef.current()}
          onImportCsv={(file) => void onImportCsv?.(file)}
          onPrint={handlePrint}
          eventTypeOptions={eventTypeOptions}
          exportDisabled={events.length === 0}
          importDisabled={readOnly || addEventDisabled || !onImportCsv}
          importBusy={importBusy}
        />
        <Button
          type="button"
          className="w-full shrink-0 gap-2 sm:w-auto"
          disabled={addEventDisabled}
          onClick={() => onAddEvent()}
        >
          <Plus className="size-4" aria-hidden />
          Add event
        </Button>
      </div>

      <SofEventsCountNotCountSummary
        events={events}
        dailyLedger={laytimeDailyLedger}
        compact={compactChrome}
      />

      <SofEventsTable
        events={events}
        eventTypeOptions={eventTypeOptions}
        readOnly={readOnly}
        eventsQueryKey={eventsQueryKey}
        eventsCsvBasename={eventsCsvBasename}
        sortOrder={sortOrder}
        showStatusColumn={showStatusColumn}
        onEventsChanged={onEventsChanged}
        onExportReady={(fn) => {
          exportCsvRef.current = fn;
        }}
        onFillGap={addEventDisabled ? undefined : (prefill) => onAddEvent(prefill)}
        fillGapPreparing={fillGapPreparing}
        hasUnloadedHistory={hasNextPage}
        footer={
          hasNextPage ? (
            <Button
              variant="secondary"
              size="sm"
              disabled={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              {isFetchingNextPage ? "Loading…" : "More events"}
            </Button>
          ) : null
        }
      />

      <SofEventsLaytimePreview
        pending={laytimeRecalcPending}
        breakdown={laytimeBreakdown}
        dailyLedger={laytimeDailyLedger}
      />

      {onSaveLaytime ? (
        <SofLaytimePersistBar
          readOnly={readOnly}
          pending={laytimeRecalcPending}
          breakdown={laytimeBreakdown}
          dailyLedger={laytimeDailyLedger}
          onSaveLaytime={onSaveLaytime}
          minimal={compactChrome}
          saveLabel={compactChrome ? "Save SOF" : "Save laytime"}
          pendingLabel="Saving…"
        />
      ) : null}
    </div>
  );
}
