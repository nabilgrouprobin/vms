"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { formatDt } from "@/lib/format";
import { parseApiErr } from "@/lib/parse-api-error";
import {
  formatDurationSpanMs,
  sofEventOwnWindow,
  sortSofEventsChronoAsc,
  toDatetimeLocalValue
} from "@/lib/sof-event-display";
import { updateSofEvent, deleteSofEvent } from "@/lib/sof-api";
import type { SofEventListItem, SofEventTypeOption } from "@/types/vms";

function rowTypeLabel(ev: SofEventListItem): string {
  return ev.eventTypeDefinition?.name ?? ev.eventTypeId;
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Ignore sub-minute differences when scanning for gaps. */
const GAP_MIN_MS = 60_000;

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
  listNote?: string;
  footer?: ReactNode;
  /** If set, shows Export CSV when there is at least one event (safe filename fragment). */
  eventsCsvBasename?: string;
  /** e.g. invalidate SOF detail after event CRUD */
  onEventsChanged?: () => void;
  /** When false, hides Normal/Hold column (remarks stay in CSV). Default true. */
  showStatusColumn?: boolean;
  /**
   * When provided, gap rows render a "Fill gap" button that calls back with
   * the gap's [start, end] ISO strings. Hidden in read-only mode.
   */
  onFillGap?: (prefill: { startIso: string; endIso: string }) => void;
};

export function SofEventsTable({
  events,
  eventTypeOptions,
  readOnly,
  eventsQueryKey,
  listNote = "Loaded rows sorted newest → oldest. Load more to extend history.",
  footer,
  eventsCsvBasename,
  onEventsChanged,
  showStatusColumn = true,
  onFillGap
}: SofEventsTableProps) {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<SofEventListItem | null>(null);
  const [editType, setEditType] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editHoldReason, setEditHoldReason] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [editErr, setEditErr] = useState<string | null>(null);

  const sortedAsc = useMemo(() => sortSofEventsChronoAsc(events), [events]);

  /** Per-row windows resolved from the event's own duration (no chaining). */
  const ownWindowsAsc = useMemo<EventRow[]>(() => {
    return sortedAsc.map((ev) => {
      const w = sofEventOwnWindow(ev);
      return { kind: "event" as const, ev, ...w };
    });
  }, [sortedAsc]);

  /** Asc list with gap placeholders inserted between adjacent windows that don't touch. */
  const displayAsc = useMemo<DisplayRow[]>(() => {
    if (ownWindowsAsc.length === 0) return [];
    const out: DisplayRow[] = [];
    let prevEndMs: number | null = null;
    for (let i = 0; i < ownWindowsAsc.length; i++) {
      const row = ownWindowsAsc[i]!;
      const currStartMs = row.fromIso
        ? new Date(row.fromIso).getTime()
        : new Date(row.toIso).getTime();
      if (prevEndMs !== null && currStartMs - prevEndMs > GAP_MIN_MS) {
        const fromIso = new Date(prevEndMs).toISOString();
        const toIso = new Date(currStartMs).toISOString();
        out.push({
          kind: "gap",
          id: `gap-${prevEndMs}-${currStartMs}`,
          fromIso,
          toIso,
          durationLabel: formatDurationSpanMs(currStartMs - prevEndMs)
        });
      }
      out.push(row);
      const currEndMs = new Date(row.toIso).getTime();
      prevEndMs = prevEndMs === null ? currEndMs : Math.max(prevEndMs, currEndMs);
    }
    return out;
  }, [ownWindowsAsc]);

  /** Newest first in the UI. */
  const displayDesc = useMemo(() => [...displayAsc].reverse(), [displayAsc]);

  const openEdit = (ev: SofEventListItem) => {
    setEdit(ev);
    setEditType(ev.eventTypeId);
    setEditTime(toDatetimeLocalValue(ev.eventTime));
    const ownWindow = sofEventOwnWindow(ev);
    setEditStartTime(ownWindow.fromIso ? toDatetimeLocalValue(ownWindow.fromIso) : "");
    setEditHoldReason(ev.holdReason ?? "");
    setEditRemarks(ev.remarks ?? "");
    setEditErr(null);
  };

  const updMut = useMutation({
    mutationFn: ({ eventId, body }: { eventId: string; body: Record<string, unknown> }) =>
      updateSofEvent(eventId, body),
    onSuccess: () => {
      setEdit(null);
      void qc.invalidateQueries({ queryKey: [...eventsQueryKey] });
      onEventsChanged?.();
    },
    onError: (e) => setEditErr(parseApiErr(e))
  });

  const downloadCsv = () => {
    if (!eventsCsvBasename || displayAsc.length === 0) return;
    const header = [
      "Event starts at",
      "Event ends at",
      "Length",
      "Type",
      "Status",
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
        row.ev.isHold ? "Hold" : "Normal",
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
  };

  const delMut = useMutation({
    mutationFn: (eventId: string) => deleteSofEvent(eventId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...eventsQueryKey] });
      onEventsChanged?.();
    },
    onError: (e) => alert(parseApiErr(e))
  });

  const editingType = useMemo(
    () => eventTypeOptions.find((t) => t.id === editType) ?? null,
    [eventTypeOptions, editType]
  );
  const editingIsHold = editingType?.category === "HOLD_DELAY";

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>Events</CardTitle>
            <CardDescription>{listNote}</CardDescription>
          </div>
          {eventsCsvBasename && sortedAsc.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full shrink-0 gap-2 sm:w-auto"
              onClick={downloadCsv}
            >
              <Download className="size-4" aria-hidden />
              Export CSV
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {displayDesc.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <div className="rounded-md border border-border overflow-x-auto">
              <table
                className={cn(
                  "w-full text-sm caption-bottom",
                  showStatusColumn ? "min-w-[720px]" : "min-w-[560px]"
                )}
              >
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                    <th className="px-3 py-2 whitespace-nowrap">Event starts at</th>
                    <th className="px-3 py-2 whitespace-nowrap">Event ends at</th>
                    <th className="px-3 py-2 whitespace-nowrap">Length</th>
                    <th className="px-3 py-2 whitespace-nowrap">Type</th>
                    {showStatusColumn ? (
                      <th className="px-3 py-2 whitespace-nowrap">Status</th>
                    ) : null}
                    <th className="px-3 py-2 whitespace-nowrap">Created by</th>
                    <th className="px-3 py-2 min-w-[12rem]">Remarks</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayDesc.map((row) => {
                    if (row.kind === "gap") {
                      return (
                        <tr
                          key={row.id}
                          className="border-b border-border last:border-0 border-l-4 border-l-destructive bg-destructive/10 text-destructive-foreground"
                        >
                          <td className="px-3 py-2 align-top whitespace-nowrap text-destructive">
                            {formatDt(row.fromIso)}
                          </td>
                          <td className="px-3 py-2 align-top whitespace-nowrap text-destructive">
                            {formatDt(row.toIso)}
                          </td>
                          <td className="px-3 py-2 align-top whitespace-nowrap text-destructive">
                            {row.durationLabel}
                          </td>
                          <td
                            className="px-3 py-2 align-top whitespace-nowrap font-medium text-destructive"
                            colSpan={
                              (showStatusColumn ? 1 : 0) +
                              1 /* created by */ +
                              1 /* remarks */ +
                              1 /* type */
                            }
                          >
                            Incomplete (gap) — fill or adjust adjacent events
                          </td>
                          <td className="px-3 py-2 align-top text-right whitespace-nowrap">
                            {onFillGap ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  onFillGap({ startIso: row.fromIso, endIso: row.toIso })
                                }
                              >
                                <Plus className="size-3.5" aria-hidden />
                                Fill gap
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    }
                    const { ev, fromIso, toIso, durationLabel } = row;
                    return (
                      <tr key={ev.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 align-top text-muted-foreground whitespace-nowrap">
                          {fromIso ? formatDt(fromIso) : "—"}
                        </td>
                        <td className="px-3 py-2 align-top whitespace-nowrap">{formatDt(toIso)}</td>
                        <td className="px-3 py-2 align-top whitespace-nowrap">{durationLabel}</td>
                        <td className="px-3 py-2 align-top font-medium whitespace-nowrap">
                          {rowTypeLabel(ev)}
                        </td>
                        {showStatusColumn ? (
                          <td className="px-3 py-2 align-top whitespace-nowrap">
                            {ev.isHold ? (
                              <span className="text-amber-600">Hold</span>
                            ) : (
                              <span className="text-muted-foreground">Normal</span>
                            )}
                          </td>
                        ) : null}
                        <td className="px-3 py-2 align-top text-muted-foreground whitespace-nowrap">
                          {ev.createdByUser.fullName}
                        </td>
                        <td className="px-3 py-2 align-top text-[11px] leading-snug text-foreground whitespace-pre-wrap break-words max-w-[28rem]">
                          {ev.remarks?.trim() ? ev.remarks : "—"}
                        </td>
                        <td className="px-3 py-2 align-top text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={readOnly}
                            onClick={() => openEdit(ev)}
                            aria-label="Edit event"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            disabled={readOnly || delMut.isPending}
                            onClick={() => {
                              if (confirm("Delete this event?")) delMut.mutate(ev.id);
                            }}
                            aria-label="Delete event"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {footer ? <div className="pt-1">{footer}</div> : null}
        </CardContent>
      </Card>

      <Sheet open={edit !== null} onOpenChange={(o) => !o && setEdit(null)}>
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
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Hold / delay is now controlled by the event type — pick a Hold/Delay type to flag
                  this event as a hold automatically.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Event ends at</Label>
                <Input
                  type="datetime-local"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Event starts at (optional)</Label>
                <Input
                  type="datetime-local"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to keep this row as a point-in-time marker that chains from the
                  previous row’s end.
                </p>
              </div>
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
                        remarks: editRemarks.trim() === "" ? null : editRemarks
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
