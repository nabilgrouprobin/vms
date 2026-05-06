"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Pencil, Trash2 } from "lucide-react";
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
  sortSofEventsChronoAsc,
  sofEventWindow,
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
  showStatusColumn = true
}: SofEventsTableProps) {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<SofEventListItem | null>(null);
  const [editType, setEditType] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editDurMinutes, setEditDurMinutes] = useState("");
  const [editHold, setEditHold] = useState(false);
  const [editHoldReason, setEditHoldReason] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [editErr, setEditErr] = useState<string | null>(null);

  const sortedAsc = useMemo(() => sortSofEventsChronoAsc(events), [events]);

  const rowsWithWindowsAsc = useMemo(() => {
    let prevTo: string | null = null;
    return sortedAsc.map((ev) => {
      const w = sofEventWindow(ev, prevTo);
      prevTo = w.toIso;
      return { ev, ...w };
    });
  }, [sortedAsc]);

  /** Newest first in the UI; windows are still derived in chronological order. */
  const rowsWithWindows = useMemo(
    () => [...rowsWithWindowsAsc].reverse(),
    [rowsWithWindowsAsc]
  );

  const openEdit = (ev: SofEventListItem) => {
    setEdit(ev);
    setEditType(ev.eventTypeId);
    setEditTime(toDatetimeLocalValue(ev.eventTime));
    const mins =
      ev.durationMinutes != null && ev.durationMinutes > 0
        ? ev.durationMinutes
        : ev.durationHours
          ? Math.round(parseFloat(ev.durationHours) * 60)
          : null;
    setEditDurMinutes(mins != null && mins > 0 ? String(mins) : "");
    setEditHold(ev.isHold);
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
    if (!eventsCsvBasename || rowsWithWindowsAsc.length === 0) return;
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
    const lines = rowsWithWindowsAsc.map(({ ev, fromIso, toIso, durationLabel }) =>
      [
        fromIso ? formatDt(fromIso) : "",
        formatDt(toIso),
        durationLabel,
        rowTypeLabel(ev),
        ev.isHold ? "Hold" : "Normal",
        ev.createdByUser.fullName,
        ev.remarks ?? "",
        ev.robQuantityMt ?? "",
        ev.dischargeQuantityMt ?? "",
        ev.cumulativeDischargeMt ?? ""
      ]
        .map((c) => escapeCsvCell(String(c)))
        .join(",")
    );
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
          {rowsWithWindows.length === 0 ? (
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
                  {rowsWithWindows.map(({ ev, fromIso, toIso, durationLabel }) => (
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
                  ))}
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
                          scope: ""
                        }
                      ]
                    : eventTypeOptions
                  ).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
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
                <Label>Length (minutes)</Label>
                <Input
                  inputMode="numeric"
                  clearPlaceholderOnFocus
                  placeholder="Optional — whole minutes from From to To (e.g. 13)"
                  value={editDurMinutes}
                  onChange={(e) => setEditDurMinutes(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to chain from the previous row’s end time automatically.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="edit-hold"
                  type="checkbox"
                  checked={editHold}
                  onChange={(e) => setEditHold(e.target.checked)}
                />
                <Label htmlFor="edit-hold">Hold / delay</Label>
              </div>
              <div className="space-y-2">
                <Label>Hold reason</Label>
                <Input
                  value={editHoldReason}
                  onChange={(e) => setEditHoldReason(e.target.value)}
                  disabled={!editHold}
                />
              </div>
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
                    const trimmed = editDurMinutes.trim();
                    if (trimmed !== "") {
                      const n = parseInt(trimmed, 10);
                      if (!Number.isFinite(n) || n <= 0) {
                        setEditErr("Duration must be a positive whole number of minutes");
                        return;
                      }
                    }
                    updMut.mutate({
                      eventId: edit.id,
                      body: {
                        eventTypeId: editType,
                        eventTime: new Date(editTime).toISOString(),
                        ...(trimmed === ""
                          ? { durationMinutes: null, durationHours: null }
                          : {
                              durationMinutes: parseInt(trimmed, 10),
                              durationHours: null
                            }),
                        isHold: editHold,
                        holdReason: editHold ? editHoldReason || null : null,
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
