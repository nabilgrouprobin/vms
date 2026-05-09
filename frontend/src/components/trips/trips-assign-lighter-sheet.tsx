"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

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
import type { OpenLighterAssignmentRow } from "@/types/vms";

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
  const [hullId, setHullId] = useState<string | null>(null);
  const [hullSearch, setHullSearch] = useState("");
  const [debouncedHullSearch, setDebouncedHullSearch] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedHullSearch(hullSearch), 300);
    return () => clearTimeout(t);
  }, [hullSearch]);

  useEffect(() => {
    if (!open) {
      setAssignmentId(null);
      setHullId(null);
      setHullSearch("");
      setDebouncedHullSearch("");
      setRemarks("");
      setError(null);
    }
  }, [open]);

  const assignmentsQ = useQuery({
    queryKey: ["open-lighter-assignments", vesselCallId],
    queryFn: () => fetchOpenLighterAssignments(vesselCallId),
    enabled: open && !!vesselCallId && canEdit
  });

  const hullsQ = useQuery({
    queryKey: ["lighter-hulls-picker", debouncedHullSearch],
    queryFn: () => fetchLighterVesselsForPicker(debouncedHullSearch || undefined, 100),
    enabled: open && canEdit
  });

  const hullRows = useMemo(() => {
    const rows = [...(hullsQ.data ?? [])];
    rows.sort((a, b) => Number(!!a.activeTrip) - Number(!!b.activeTrip));
    return rows;
  }, [hullsQ.data]);

  useEffect(() => {
    if (!hullId || !hullsQ.data) return;
    if (!hullsQ.data.some((r) => r.id === hullId)) {
      setHullId(null);
    }
  }, [hullsQ.data, hullId]);

  const createM = useMutation({
    mutationFn: (payload: {
      vesselCallId: string;
      lighterVesselId: string;
      remarks?: string | null;
    }) => createLighterTrip(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["trips-by-vessel-call", vesselCallId] });
      await qc.invalidateQueries({ queryKey: ["open-lighter-assignments", vesselCallId] });
      await qc.invalidateQueries({ queryKey: ["trips-vessel-call-picker"] });
      await qc.invalidateQueries({ queryKey: ["trips-lighter-hull-picker"] });
      await qc.invalidateQueries({ queryKey: ["lighter-hulls-picker"] });
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
          trip; the physical lighter hull must not already have an unfinished trip.
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
                          Registry lighter: {a.lighter.name} · Carrier:{" "}
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
              <Label htmlFor="hull-search">Physical lighter hull</Label>
              <Input
                id="hull-search"
                placeholder="Search by hull name or IMO…"
                value={hullSearch}
                onChange={(e) => setHullSearch(e.target.value)}
              />
              {hullsQ.isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : hullsQ.isError ? (
                <p className="text-sm text-destructive">{parseApiErr(hullsQ.error)}</p>
              ) : hullRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No lighter hulls match this search. Try another name or IMO, or check that the
                  registry has active lighter vessels.
                </p>
              ) : hullRows.every((v) => v.activeTrip != null) ? (
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Every hull in this list already has an unfinished trip — you cannot pick them
                  here. Search for another hull, or finish or close the existing trip first.
                </p>
              ) : (
                <ul className="max-h-52 space-y-2 overflow-y-auto rounded-md border border-border p-2">
                  {hullRows.map((v) => {
                    const busy = v.activeTrip != null;
                    return (
                      <li key={v.id}>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => !busy && setHullId(v.id)}
                          className={cn(
                            "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                            hullId === v.id && !busy
                              ? "border-primary bg-primary/5"
                              : "border-transparent hover:bg-muted/60",
                            busy && "cursor-not-allowed opacity-50"
                          )}
                        >
                          <div className="font-medium">{v.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {v.imoNo ? `IMO ${v.imoNo}` : "No IMO"}
                            {busy
                              ? ` · Busy on ${v.activeTrip!.tripNo} (${v.activeTrip!.status}) @ ${v.activeTrip!.vesselCall.vessel.name}`
                              : " · Available"}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
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
              {!hullId
                ? hullRows.length > 0 && hullRows.every((v) => v.activeTrip != null)
                  ? "All hulls above are busy — search for another hull or free one by closing its trip."
                  : "Select an available lighter hull above (rows marked Busy cannot be used)."
                : "Ready to create this trip."}
            </p>

            <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-4">
              <Button
                type="button"
                disabled={!hullId || createM.isPending}
                onClick={() => {
                  setError(null);
                  if (!hullId) {
                    setError("Choose a lighter hull.");
                    return;
                  }
                  void createM.mutate({
                    vesselCallId,
                    lighterVesselId: hullId,
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
