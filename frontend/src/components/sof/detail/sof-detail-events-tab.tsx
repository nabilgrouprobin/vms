"use client";

import { Plus } from "lucide-react";
import type { ReactNode } from "react";

import { SofEventsTable } from "@/components/sof/sof-events-table";
import { SofEventsTimeSummary } from "@/components/sof/sof-events-time-summary";
import { Button } from "@/components/ui/button";
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
  addEventDisabled: boolean;
  onAddEvent: (prefill?: SofAddEventPrefill) => void;
  events: SofEventListItem[];
  eventTypeOptions: SofEventTypeOption[];
  readOnly: boolean;
  eventsQueryKey: readonly unknown[];
  eventsCsvBasename: string;
  showStatusColumn?: boolean;
  onEventsChanged?: () => void;
  pagination: SofDetailEventsTabPagination;
  /** When true, the "Fill gap" buttons render in a disabled "Preparing…" state. */
  fillGapPreparing?: boolean;
};

/** Shared layout: context panel, add-event row, events table with infinite footer. */
export function SofDetailEventsTab({
  contextPanel,
  addEventDisabled,
  onAddEvent,
  events,
  eventTypeOptions,
  readOnly,
  eventsQueryKey,
  eventsCsvBasename,
  showStatusColumn,
  onEventsChanged,
  pagination,
  fillGapPreparing
}: SofDetailEventsTabProps) {
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = pagination;

  return (
    <div className="space-y-3">
      {contextPanel}

      <SofEventsTimeSummary events={events} hasUnloadedHistory={hasNextPage} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          className="w-full gap-2 sm:w-auto"
          disabled={addEventDisabled}
          onClick={() => onAddEvent()}
        >
          <Plus className="size-4" aria-hidden />
          Add event
        </Button>
      </div>

      <SofEventsTable
        events={events}
        eventTypeOptions={eventTypeOptions}
        readOnly={readOnly}
        eventsQueryKey={eventsQueryKey}
        eventsCsvBasename={eventsCsvBasename}
        showStatusColumn={showStatusColumn}
        onEventsChanged={onEventsChanged}
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
    </div>
  );
}
