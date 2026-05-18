"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SofLaytimeCountToggle } from "@/components/sof/sof-laytime-count-toggle";
import { SofLocalDatetimeInputs } from "@/components/sof/sof-local-datetime-inputs";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { formatDt } from "@/lib/format";
import { formatSofUserError } from "@/lib/format-sof-user-error";
import { parseApiErr } from "@/lib/parse-api-error";
import { toast } from "@/lib/toast";
import {
  findSofTimelineGaps,
  formatDurationSpanMs,
  sofEventOwnWindow,
  sortSofEventsChronoAsc,
  toDatetimeLocalValue
} from "@/lib/sof-event-display";
import { updateSofEvent, deleteSofEvent } from "@/lib/sof-api";
import { VESSEL_SOF_CLEAR_SELECTION_EVENT } from "@/lib/workspace-paths";
import type { SofEventListItem, SofEventTypeOption } from "@/types/vms";

function rowTypeLabel(ev: SofEventListItem): string {
  return ev.eventTypeDefinition?.name ?? ev.eventTypeId;
}

/** Category from the event type definition (authoritative); falls back to `isHold` if missing. */
function rowCategoryFromEventType(ev: SofEventListItem): {
  label: "Hold" | "Normal" | "Prep";
  isHold: boolean;
} {
  const cat = ev.eventTypeDefinition?.category;
  if (cat === "HOLD_DELAY") return { label: "Hold", isHold: true };
  if (cat === "PREPARATION") return { label: "Prep", isHold: false };
  if (cat === "NORMAL") return { label: "Normal", isHold: false };
  return ev.isHold ? { label: "Hold", isHold: true } : { label: "Normal", isHold: false };
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function EventTh({
  children,
  className,
  align = "left"
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={cn(
        "px-2 py-1 text-[10px] font-semibold text-foreground whitespace-nowrap",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className
      )}
    >
      {children}
    </th>
  );
}

function EventCategoryBadge({ isHold, label }: { isHold: boolean; label: string }) {
  const short =
    label === "Hold" ? "Hold" : label === "Prep" ? "Prep" : "Norm";
  if (isHold) {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full border border-amber-500/70 bg-amber-50 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-amber-900 dark:border-amber-400/60 dark:bg-amber-950/40 dark:text-amber-100">
        {short}
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-background px-1.5 py-px text-[9px] font-medium text-muted-foreground">
      {short}
    </span>
  );
}

type EventRow = {
  kind: "event";
  ev: SofEventListItem;
  fromIso: string | null;
  toIso: string;
  durationLabel: string;
};

type GapRow = {
  kind: "gap";
  /** Stable id for React keys. */
  id: string;
  fromIso: string;
  toIso: string;
  durationLabel: string;
};

type DisplayRow = EventRow | GapRow;

type SofEventsTableProps = {
  events: SofEventListItem[];
  /** Types shown when editing an event (same catalog as “Add event”). */
  eventTypeOptions: SofEventTypeOption[];
  readOnly: boolean;
  eventsQueryKey: readonly unknown[];
  footer?: ReactNode;
  sortOrder?: "newest" | "oldest";
  /** If set, enables CSV export via `onExportCsv` (safe filename fragment). */
  eventsCsvBasename?: string;
  /** Parent toolbar calls the registered export function. */
  onExportReady?: (exportCsv: () => void) => void;
  /** e.g. invalidate SOF detail after event CRUD */
  /** Called after event CRUD; await recalc when laytime should refresh. */
  onEventsChanged?: () => void | Promise<void>;
  /** When false, hides the Category column (Hold vs Normal from event type). Default true. */
  showStatusColumn?: boolean;
  printAreaId?: string;
  /** To count / not to count laytime toggle per event. Default true. */
  showLaytimeCountColumn?: boolean;
  /**
   * When provided, gap rows render a "Fill gap" button that calls back with
   * the gap's [start, end] ISO strings. Hidden in read-only mode.
   */
  onFillGap?: (prefill: { startIso: string; endIso: string }) => void;
  /**
   * When true the "Fill gap" buttons render disabled with a "Preparing…"
   * label — used while the parent view is refreshing the events list so
   * the eventual pre-fill matches reality instead of the stale cache.
   */
  fillGapPreparing?: boolean;
  /**
   * True when more pages of older events remain unloaded (e.g.
   * `useInfiniteQuery.hasNextPage`). When true, gap detection is suppressed
   * because an apparent "gap" between two loaded rows might actually be
   * filled by an event sitting in an unloaded page; clicking "Fill gap"
   * would then be rejected by the backend as "events cannot overlap".
   */
  hasUnloadedHistory?: boolean;
};

export function SofEventsTable({
  events,
  eventTypeOptions,
  readOnly,
  eventsQueryKey,
  footer,
  sortOrder = "newest",
  eventsCsvBasename,
  onExportReady,
  onEventsChanged,
  showStatusColumn = false,
  printAreaId = "sof-events-print",
  showLaytimeCountColumn = true,
  onFillGap,
  fillGapPreparing = false,
  hasUnloadedHistory = false
}: SofEventsTableProps) {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<SofEventListItem | null>(null);

  useEffect(() => {
    const onWorkspaceClear = () => setEdit(null);
    window.addEventListener(VESSEL_SOF_CLEAR_SELECTION_EVENT, onWorkspaceClear);
    return () => window.removeEventListener(VESSEL_SOF_CLEAR_SELECTION_EVENT, onWorkspaceClear);
  }, []);
  const [editType, setEditType] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editHoldReason, setEditHoldReason] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [editCountsAsLaytime, setEditCountsAsLaytime] = useState(true);
  const [editErr, setEditErr] = useState<string | null>(null);

  const sortedAsc = useMemo(() => sortSofEventsChronoAsc(events), [events]);

  /** Per-row windows resolved from the event's own duration (no chaining). */
  const ownWindowsAsc = useMemo<EventRow[]>(() => {
    return sortedAsc.map((ev) => {
      const w = sofEventOwnWindow(ev);
      return { kind: "event" as const, ev, ...w };
    });
  }, [sortedAsc]);

  /**
   * Asc list with gap placeholders interleaved between adjacent event windows.
   *
   * Gap detection is shared with the backend via `findSofTimelineGaps`: rows
   * WITHOUT their own duration implicitly fill the period from the previous
   * row's end to their `eventTime`, so no "Fill gap" affordance is shown
   * before them (otherwise the backend would reject the resulting insert as
   * "events cannot overlap").
   *
   * When `hasUnloadedHistory` is true we skip gap detection entirely: the
   * apparent gap between two adjacent loaded rows might be filled by an
   * older event sitting on a page the user hasn't loaded yet. We surface
   * that explicitly via the `listNote` instead of a misleading red "gap" row.
   */
  const displayAsc = useMemo<DisplayRow[]>(() => {
    if (ownWindowsAsc.length === 0) return [];
    if (hasUnloadedHistory) return ownWindowsAsc;
    const gaps = findSofTimelineGaps(ownWindowsAsc);
    if (gaps.length === 0) return ownWindowsAsc;
    const gapByCurrStart = new Map(gaps.map((g) => [new Date(g.toIso).getTime(), g]));
    const out: DisplayRow[] = [];
    for (const row of ownWindowsAsc) {
      const currStartMs = row.fromIso
        ? new Date(row.fromIso).getTime()
        : new Date(row.toIso).getTime();
      const gap = gapByCurrStart.get(currStartMs);
      if (gap) {
        out.push({
          kind: "gap",
          id: `gap-${new Date(gap.fromIso).getTime()}-${currStartMs}`,
          fromIso: gap.fromIso,
          toIso: gap.toIso,
          durationLabel: formatDurationSpanMs(gap.spanMs)
        });
      }
      out.push(row);
    }
    return out;
  }, [ownWindowsAsc, hasUnloadedHistory]);

  const displayOrdered = useMemo(
    () => (sortOrder === "newest" ? [...displayAsc].reverse() : displayAsc),
    [displayAsc, sortOrder]
  );

  const openEdit = (ev: SofEventListItem) => {
    setEdit(ev);
    setEditType(ev.eventTypeId);
    setEditTime(toDatetimeLocalValue(ev.eventTime));
    const ownWindow = sofEventOwnWindow(ev);
    setEditStartTime(ownWindow.fromIso ? toDatetimeLocalValue(ownWindow.fromIso) : "");
    setEditHoldReason(ev.holdReason ?? "");
    setEditRemarks(ev.remarks ?? "");
    setEditCountsAsLaytime(ev.countsAsLaytime !== false);
    setEditErr(null);
  };

  const countMut = useMutation({
    mutationFn: ({
      eventId,
      countsAsLaytime
    }: {
      eventId: string;
      countsAsLaytime: boolean;
    }) => updateSofEvent(eventId, { countsAsLaytime }),
    onSuccess: async (_data, { countsAsLaytime }) => {
      await qc.refetchQueries({ queryKey: [...eventsQueryKey] });
      await onEventsChanged?.();
      toast.success(
        countsAsLaytime
          ? "This event now counts toward laytime on the daily sheet."
          : "This event is excluded from laytime count.",
        {
          title: countsAsLaytime ? "Marked as count" : "Marked as not count",
          durationMs: 3500
        }
      );
    },
    onError: (e) => toast.error(formatSofUserError(e))
  });

  const updMut = useMutation({
    mutationFn: ({ eventId, body }: { eventId: string; body: Record<string, unknown> }) =>
      updateSofEvent(eventId, body),
    onSuccess: async () => {
      setEdit(null);
      await qc.refetchQueries({ queryKey: [...eventsQueryKey] });
      await onEventsChanged?.();
    },
    onError: (e) => {
      const msg = formatSofUserError(e);
      setEditErr(msg);
      toast.error(msg);
    }
  });

  const downloadCsv = useCallback(() => {
    if (!eventsCsvBasename || sortedAsc.length === 0) return;
    const header = [
      "Event starts at",
      "Event ends at",
      "Length",
      "Type",
      "Laytime count",
      "Created by",
      "Remarks",
      "ROB MT",
      "Discharge MT",
      "Cumulative MT"
    ];
    const lines = displayAsc.map((row) => {
      if (row.kind === "gap") {
        return [
          formatDt(row.fromIso),
          formatDt(row.toIso),
          row.durationLabel,
          "(gap)",
          "Incomplete",
          "",
          "",
          "",
          "",
          ""
        ]
          .map((c) => escapeCsvCell(String(c)))
          .join(",");
      }
      return [
        row.fromIso ? formatDt(row.fromIso) : "",
        formatDt(row.toIso),
        row.durationLabel,
        rowTypeLabel(row.ev),
        row.ev.countsAsLaytime !== false ? "Count" : "Not count",
        row.ev.createdByUser.fullName,
        row.ev.remarks ?? "",
        row.ev.robQuantityMt ?? "",
        row.ev.dischargeQuantityMt ?? "",
        row.ev.cumulativeDischargeMt ?? ""
      ]
        .map((c) => escapeCsvCell(String(c)))
        .join(",");
    });
    const blob = new Blob([[header.join(","), ...lines].join("\r\n")], {
      type: "text/csv;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventsCsvBasename.replace(/[^a-zA-Z0-9._-]+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [eventsCsvBasename, sortedAsc, displayAsc]);

  /**
   * Hard-delete an SOF event. The mutation also forces a refetch of the
   * events list and notifies the parent (`onEventsChanged`) so the SOF
   * detail (laytime totals, gap rows, latest-event metrics) recomputes
   * immediately. We surface a success toast so the user can confirm the
   * row really is gone from the database, not just from the cached view.
   */
  const delMut = useMutation({
    mutationFn: (eventId: string) => deleteSofEvent(eventId),
    onSuccess: async () => {
      await qc.refetchQueries({ queryKey: [...eventsQueryKey] });
      await onEventsChanged?.();
      toast.success("Event deleted");
    },
    onError: (e) => toast.error(formatSofUserError(e))
  });

  const editingType = useMemo(
    () => eventTypeOptions.find((t) => t.id === editType) ?? null,
    [eventTypeOptions, editType]
  );
  const editingIsHold = editingType?.category === "HOLD_DELAY";

  useEffect(() => {
    if (onExportReady) onExportReady(downloadCsv);
  }, [onExportReady, downloadCsv]);

  return (
    <>
      <Card className="shadow-sm" id={printAreaId}>
        <CardContent className="space-y-2 px-3 py-3">
          {hasUnloadedHistory ? (
            <p className="text-[10px] text-amber-700 dark:text-amber-400">
              Load more events before filling gaps — older rows may not be loaded yet.
            </p>
          ) : null}
          {displayOrdered.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No events yet.</p>
          ) : (
            <div className="space-y-2">
              <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table
                className={cn(
                  "w-full min-w-[720px] border-collapse text-[11px]",
                  showLaytimeCountColumn
                    ? showStatusColumn
                      ? "min-w-[800px]"
                      : "min-w-[680px]"
                    : showStatusColumn
                      ? "min-w-[640px]"
                      : "min-w-[520px]"
                )}
              >
                <thead className="sticky top-0 z-[1] bg-muted/98 backdrop-blur-sm">
                  <tr className="border-b border-border">
                    <EventTh>Start</EventTh>
                    <EventTh>End</EventTh>
                    <EventTh>Length</EventTh>
                    <EventTh>Type</EventTh>
                    {showStatusColumn ? <EventTh>Cat.</EventTh> : null}
                    {showLaytimeCountColumn ? (
                      <EventTh align="center" className="min-w-[8.25rem]">
                        Laytime
                      </EventTh>
                    ) : null}
                    <EventTh>By</EventTh>
                    <EventTh className="min-w-[8rem]">Remarks</EventTh>
                    <EventTh align="right"> </EventTh>
                  </tr>
                </thead>
                <tbody>
                  {displayOrdered.map((row, rowIdx) => {
                    const rowBase =
                      "border-b border-border/70 transition-colors hover:bg-muted/25";
                    const cell = "px-2 py-1 align-middle whitespace-nowrap";
                    const cellMono = cn(
                      cell,
                      "font-mono text-[10px] tabular-nums leading-tight"
                    );

                    if (row.kind === "gap") {
                      return (
                        <tr
                          key={row.id}
                          className={cn(
                            rowBase,
                            "border-l-4 border-l-destructive bg-destructive/10 text-destructive"
                          )}
                        >
                          <td className={cn(cellMono, "text-destructive")}>
                            {formatDt(row.fromIso)}
                          </td>
                          <td className={cn(cellMono, "text-destructive")}>
                            {formatDt(row.toIso)}
                          </td>
                          <td className={cn(cellMono, "font-semibold text-destructive")}>
                            {row.durationLabel}
                          </td>
                          <td
                            className={cn(cell, "text-[10px] font-medium text-destructive")}
                            colSpan={
                              (showStatusColumn ? 1 : 0) +
                              (showLaytimeCountColumn ? 1 : 0) +
                              1 /* created by */ +
                              1 /* remarks */ +
                              1 /* type */
                            }
                          >
                            Incomplete (gap)
                          </td>
                          <td className={cn(cell, "text-right")}>
                            {onFillGap ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={fillGapPreparing}
                                className="h-6 gap-1 border-destructive/40 px-2 text-[10px] text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  onFillGap({ startIso: row.fromIso, endIso: row.toIso })
                                }
                              >
                                <Plus className="size-3" aria-hidden />
                                {fillGapPreparing ? "…" : "Fill"}
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    }
                    const { ev, fromIso, toIso, durationLabel } = row;
                    const cat = rowCategoryFromEventType(ev);
                    return (
                      <tr
                        key={ev.id}
                        className={cn(rowBase, rowIdx % 2 === 1 && "bg-muted/10")}
                      >
                        <td className={cn(cellMono, "text-muted-foreground")}>
                          {fromIso ? formatDt(fromIso) : "—"}
                        </td>
                        <td className={cn(cellMono, "text-foreground")}>{formatDt(toIso)}</td>
                        <td className={cn(cellMono, "font-semibold text-foreground")}>
                          {durationLabel}
                        </td>
                        <td
                          className={cn(
                            cell,
                            "max-w-[8rem] truncate text-[10px] font-medium text-foreground"
                          )}
                        >
                          {rowTypeLabel(ev)}
                        </td>
                        {showStatusColumn ? (
                          <td className={cell}>
                            <EventCategoryBadge isHold={cat.isHold} label={cat.label} />
                          </td>
                        ) : null}
                        {showLaytimeCountColumn ? (
                          <td className={cn(cell, "text-center")}>
                            <div className="flex justify-center">
                              <SofLaytimeCountToggle
                                variant="table"
                                confirmChange
                                disabled={readOnly || countMut.isPending}
                                value={ev.countsAsLaytime !== false}
                                onChange={(countsAsLaytime) =>
                                  countMut.mutate({ eventId: ev.id, countsAsLaytime })
                                }
                              />
                            </div>
                          </td>
                        ) : null}
                        <td
                          className={cn(
                            cell,
                            "max-w-[5.5rem] truncate text-[10px] text-muted-foreground"
                          )}
                          title={ev.createdByUser.fullName}
                        >
                          {ev.createdByUser.fullName}
                        </td>
                        <td
                          className={cn(
                            cell,
                            "max-w-md whitespace-normal break-words text-[10px] leading-snug text-foreground align-top"
                          )}
                        >
                          {ev.remarks?.trim() ? ev.remarks : "—"}
                        </td>
                        <td className={cn(cell, "text-right")}>
                          <div className="inline-flex items-center gap-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-foreground"
                              disabled={readOnly}
                              onClick={() => openEdit(ev)}
                              aria-label="Edit event"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive/80 hover:text-destructive"
                              disabled={readOnly || delMut.isPending}
                              onClick={() => {
                                if (confirm("Delete this event?")) delMut.mutate(ev.id);
                              }}
                              aria-label="Delete event"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}
          {footer ? <div className="pt-1">{footer}</div> : null}
        </CardContent>
      </Card>

      <Sheet open={edit !== null} onOpenChange={(o) => !o && setEdit(null)} modal={false}>
        <SheetContent side="right" className="flex flex-col gap-4 overflow-y-auto">
          <div className="space-y-1.5 pr-8">
            <SheetTitle>Edit event</SheetTitle>
            <SheetDescription>Changes apply to this SOF row only.</SheetDescription>
          </div>
          {edit ? (
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                >
                  {(edit && !eventTypeOptions.some((t) => t.id === edit.eventTypeId)
                    ? [
                        ...eventTypeOptions,
                        {
                          id: edit.eventTypeId,
                          code: edit.eventTypeDefinition.code,
                          name: `${edit.eventTypeDefinition.name} (inactive)`,
                          scope: "",
                          category: edit.isHold ? "HOLD_DELAY" : "NORMAL"
                        } as SofEventTypeOption
                      ]
                    : eventTypeOptions
                  ).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Event ends at</Label>
                <p className="text-xs text-muted-foreground">Local date and time · 24-hour clock.</p>
                <SofLocalDatetimeInputs value={editTime} onChange={setEditTime} />
              </div>
              <div className="space-y-2">
                <Label>Event starts at (optional)</Label>
                <SofLocalDatetimeInputs value={editStartTime} onChange={setEditStartTime} />
                <p className="text-xs text-muted-foreground">
                  Leave the date empty to keep this row as a point-in-time marker that chains from
                  the previous row’s end.
                </p>
              </div>
              {showLaytimeCountColumn ? (
                <div className="space-y-2 rounded-lg border border-border/80 bg-muted/10 p-3">
                  <Label className="text-xs">Laytime (contact window)</Label>
                  <SofLaytimeCountToggle
                    value={editCountsAsLaytime}
                    onChange={setEditCountsAsLaytime}
                  />
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    Count + not count = contact on the daily sheet. Free time is not split.
                  </p>
                </div>
              ) : null}
              {editingIsHold ? (
                <div className="space-y-2">
                  <Label>Hold reason</Label>
                  <Input
                    value={editHoldReason}
                    onChange={(e) => setEditHoldReason(e.target.value)}
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>Remarks</Label>
                <textarea
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  rows={4}
                  className={cn(
                    "flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors",
                    "placeholder:text-muted-foreground focus:placeholder:text-transparent focus:placeholder:opacity-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Created by {edit.createdByUser.fullName} (cannot be changed here).
              </p>
              {editErr ? <p className="text-sm text-destructive">{editErr}</p> : null}
              <div className="flex gap-2 pt-2">
                <Button
                  disabled={updMut.isPending}
                  onClick={() => {
                    setEditErr(null);
                    if (!editTime) {
                      setEditErr("Event ends at is required");
                      return;
                    }
                    if (!edit) return;
                    const endMs = new Date(editTime).getTime();
                    if (!Number.isFinite(endMs)) {
                      setEditErr("Invalid end time");
                      return;
                    }
                    let durationPayload:
                      | { durationMinutes: number; durationHours: null }
                      | { durationMinutes: null; durationHours: null };
                    if (editStartTime.trim() !== "") {
                      const startMs = new Date(editStartTime).getTime();
                      if (!Number.isFinite(startMs)) {
                        setEditErr("Invalid start time");
                        return;
                      }
                      if (startMs >= endMs) {
                        setEditErr("Start time must be before end time");
                        return;
                      }
                      durationPayload = {
                        durationMinutes: Math.max(1, Math.round((endMs - startMs) / 60_000)),
                        durationHours: null
                      };
                    } else {
                      durationPayload = { durationMinutes: null, durationHours: null };
                    }
                    updMut.mutate({
                      eventId: edit.id,
                      body: {
                        eventTypeId: editType,
                        eventTime: new Date(endMs).toISOString(),
                        ...durationPayload,
                        holdReason: editingIsHold ? editHoldReason || null : null,
                        remarks: editRemarks.trim() === "" ? null : editRemarks,
                        ...(showLaytimeCountColumn
                          ? { countsAsLaytime: editCountsAsLaytime }
                          : {})
                      }
                    });
                  }}
                >
                  Save
                </Button>
                <Button variant="outline" type="button" onClick={() => setEdit(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
