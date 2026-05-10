"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { invalidateMotherLighterPickerCaches } from "@/components/workspace/mother-lighter-vessel-picker-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createLighterTrip,
  fetchLighterVesselsForPicker,
  fetchOpenLighterAssignments
} from "@/lib/lighter-trips-api";
import { parseApiErr } from "@/lib/parse-api-error";
import { cn } from "@/lib/utils";
import type { LighterVesselPickerRow, OpenLighterAssignmentRow, Paginated } from "@/types/vms";

type Props = {
  vesselCallId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  motherTitle: string;
};

export function TripsAssignLighterSheet({
  vesselCallId,
  open,
  onOpenChange,
  canEdit,
  motherTitle
}: Props) {
  const qc = useQueryClient();
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [lighterVesselIdPick, setLighterVesselIdPick] = useState<string | null>(null);
  const [lighterSearch, setLighterSearch] = useState("");
  const debouncedLighterSearch = useDebouncedValue(lighterSearch, 300);
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setAssignmentId(null);
      setLighterVesselIdPick(null);
      setLighterSearch("");
      setRemarks("");
      setError(null);
    }
  }, [open]);

  const assignmentsQ = useQuery({
    queryKey: ["open-lighter-assignments", vesselCallId],
    queryFn: () => fetchOpenLighterAssignments(vesselCallId),
    enabled: open && !!vesselCallId && canEdit
  });

  const lighterPickQ = useInfiniteQuery({
    queryKey: ["lighter-hulls-picker", debouncedLighterSearch],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchLighterVesselsForPicker({
        search: debouncedLighterSearch || undefined,
        cursor: pageParam,
        limit: 40,
        includeInactive: false
      }),
    getNextPageParam: (last: Paginated<LighterVesselPickerRow>) => last.nextCursor ?? undefined,
    enabled: open && canEdit
  });

  const lighterPickRows = useMemo(() => {
    const rows = [...(lighterPickQ.data?.pages.flatMap((p) => p.data) ?? [])];
    rows.sort((a, b) => Number(!!a.activeTrip) - Number(!!b.activeTrip));
    return rows;
  }, [lighterPickQ.data]);

  useEffect(() => {
    if (!lighterVesselIdPick || !lighterPickRows.length) return;
    if (!lighterPickRows.some((r) => r.id === lighterVesselIdPick)) {
      setLighterVesselIdPick(null);
    }
  }, [lighterPickRows, lighterVesselIdPick]);

  const createM = useMutation({
    mutationFn: (payload: {
      vesselCallId: string;
      lighterVesselId: string;
      remarks?: string | null;
    }) => createLighterTrip(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["trips-by-vessel-call", vesselCallId] });
      await qc.invalidateQueries({ queryKey: ["open-lighter-assignments", vesselCallId] });
      await invalidateMotherLighterPickerCaches(qc);
      onOpenChange(false);
    },
    onError: (e) => setError(parseApiErr(e))
  });

  const assignments = assignmentsQ.data ?? [];
  const effectiveAssignmentId = assignmentId ?? (assignments[0]?.id ?? null);

  useEffect(() => {
    if (!open) return;
    if (assignmentId && !assignments.some((a) => a.id === assignmentId)) {
      setAssignmentId(null);
      return;
    }
    if (!assignmentId && assignments.length > 0) {
      setAssignmentId(assignments[0]!.id);
    }
  }, [open, assignments, assignmentId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetTitle>Assign lighter</SheetTitle>
        <SheetDescription>
          Start a trip on an open carrier allocation for {motherTitle}. Each allocation can have one
          trip; the lighter vessel must not already have an unfinished trip.
        </SheetDescription>

        {!canEdit ? (
          <p className="text-sm text-muted-foreground">
            Your role does not allow creating lighter trips. Ask an operations manager or lighter
            assignment officer.
          </p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1 pt-2">
            <section className="space-y-2">
              <Label className="text-base">Open allocations (auto-selected)</Label>
              {assignmentsQ.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : assignmentsQ.isError ? (
                <p className="text-sm text-destructive">{parseApiErr(assignmentsQ.error)}</p>
              ) : assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No open allocations without a trip for this mother vessel call. Add carrier
                  allocations in the operations workflow (or seed data) before assigning lighters
                  here.
                </p>
              ) : (
                <ul className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border p-2">
                  {assignments.map((a: OpenLighterAssignmentRow) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => setAssignmentId(a.id)}
                        className={cn(
                          "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                          assignmentId === a.id
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:bg-muted/60"
                        )}
                      >
                        <div className="font-medium">{a.assignmentNo}</div>
                        <div className="text-xs text-muted-foreground">
                          Lighter: {a.lighter.name} · Carrier:{" "}
                          {a.carrier.organization.name} · {a.estimatedQtyMt} MT est. · Ghat:{" "}
                          {a.destinationGhat.name}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <Label htmlFor="lighter-search">Lighter vessel</Label>
              <Input
                id="lighter-search"
                placeholder="Search by name or IMO…"
                value={lighterSearch}
                onChange={(e) => setLighterSearch(e.target.value)}
              />
              {lighterPickQ.isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : lighterPickQ.isError ? (
                <p className="text-sm text-destructive">{parseApiErr(lighterPickQ.error)}</p>
              ) : lighterPickRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active lighter vessels match this search. Try another name or IMO, or add
                  lighters under Master data.
                </p>
              ) : lighterPickRows.every((v) => v.activeTrip != null || v.isActive === false) ? (
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Every vessel in this list is busy or inactive — pick another or restore an active
                  lighter in Master data.
                </p>
              ) : (
                <>
                  <ul className="max-h-52 space-y-2 overflow-y-auto rounded-md border border-border p-2">
                    {lighterPickRows.map((v) => {
                      const busy = v.activeTrip != null;
                      const inactive = v.isActive === false;
                      const blocked = busy || inactive;
                      return (
                        <li key={v.id}>
                          <button
                            type="button"
                            disabled={blocked}
                            onClick={() => !blocked && setLighterVesselIdPick(v.id)}
                            className={cn(
                              "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                              lighterVesselIdPick === v.id && !blocked
                                ? "border-primary bg-primary/5"
                                : "border-transparent hover:bg-muted/60",
                              blocked && "cursor-not-allowed opacity-50"
                            )}
                          >
                            <div className="font-medium">{v.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {v.imoNo ? `IMO ${v.imoNo}` : "No IMO"}
                              {inactive
                                ? " · Inactive"
                                : busy
                                  ? ` · Busy on ${v.activeTrip!.tripNo} (${v.activeTrip!.status}) @ ${v.activeTrip!.vesselCall.vessel.name}`
                                  : " · Available"}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {lighterPickQ.hasNextPage ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      disabled={lighterPickQ.isFetchingNextPage}
                      onClick={() => void lighterPickQ.fetchNextPage()}
                    >
                      {lighterPickQ.isFetchingNextPage ? "Loading…" : "Load more lighters"}
                    </Button>
                  ) : null}
                </>
              )}
            </section>

            <section className="space-y-2">
              <Label htmlFor="trip-remarks">Remarks (optional)</Label>
              <Input
                id="trip-remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Notes for trip creation…"
              />
            </section>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <p className="text-xs text-muted-foreground">
              {!lighterVesselIdPick
                ? lighterPickRows.length > 0 &&
                    lighterPickRows.every((v) => v.activeTrip != null || v.isActive === false)
                  ? "All rows above are busy or inactive — search or load more, or fix Master data."
                  : "Select an available lighter vessel above."
                : "Ready to create this trip."}
            </p>

            <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-4">
              <Button
                type="button"
                disabled={!lighterVesselIdPick || createM.isPending}
                onClick={() => {
                  setError(null);
                  if (!lighterVesselIdPick) {
                    setError("Choose a lighter vessel.");
                    return;
                  }
                  void createM.mutate({
                    vesselCallId,
                    lighterVesselId: lighterVesselIdPick,
                    remarks: remarks.trim() || null
                  });
                }}
              >
                {createM.isPending ? "Creating…" : "Create trip"}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
