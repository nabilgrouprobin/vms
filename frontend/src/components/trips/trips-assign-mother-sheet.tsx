"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { invalidateMotherLighterPickerCaches } from "@/components/workspace/mother-lighter-vessel-picker-panel";
import { createLighterTrip } from "@/lib/lighter-trips-api";
import { parseApiErr } from "@/lib/parse-api-error";
import { fetchVesselCalls } from "@/lib/vessel-calls-api";
import type { Paginated, VesselCallListRow } from "@/types/vms";

type Props = {
  lighterVesselId: string;
  /** Current lighter tab port visit — stored on new trips for SOF/workspace deep-links. */
  lighterPortCallId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  lighterTitle: string;
};

export function TripsAssignMotherSheet({
  lighterVesselId,
  lighterPortCallId,
  open,
  onOpenChange,
  canEdit,
  lighterTitle
}: Props) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [vesselCallId, setVesselCallId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setVesselCallId(null);
      setRemarks("");
      setError(null);
    }
  }, [open]);

  const callsQ = useInfiniteQuery({
    queryKey: ["trips-mother-call-picker", debouncedSearch],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      fetchVesselCalls({
        limit: 20,
        cursor: pageParam,
        search: debouncedSearch || undefined
      }),
    getNextPageParam: (last: Paginated<VesselCallListRow>) => last.nextCursor ?? undefined,
    enabled: open && canEdit
  });

  const rows = useMemo(() => callsQ.data?.pages.flatMap((p) => p.data) ?? [], [callsQ.data]);

  const createM = useMutation({
    mutationFn: () =>
      createLighterTrip({
        vesselCallId: vesselCallId!,
        lighterVesselId,
        ...(lighterPortCallId?.trim() ? { lighterPortCallId: lighterPortCallId.trim() } : {}),
        remarks: remarks.trim() || null
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["trips-by-lighter-hull", lighterVesselId] });
      await invalidateMotherLighterPickerCaches(qc);
      onOpenChange(false);
    },
    onError: (e) => setError(parseApiErr(e))
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetTitle>Assign to mother vessel</SheetTitle>
        <SheetDescription>
          Assign {lighterTitle} to one mother vessel call. One lighter can have only one active trip
          at a time.
        </SheetDescription>

        {!canEdit ? (
          <p className="text-sm text-muted-foreground">
            Your role does not allow creating lighter trips.
          </p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1 pt-2">
            <section className="space-y-2">
              <Label htmlFor="mv-search">Mother vessel call</Label>
              <Input
                id="mv-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search call no., vessel, cargo…"
              />
              {callsQ.isLoading ? (
                <Skeleton className="h-28 w-full" />
              ) : callsQ.isError ? (
                <p className="text-sm text-destructive">{parseApiErr(callsQ.error)}</p>
              ) : rows.length === 0 ? (
                <div className="space-y-2 rounded-md border border-dashed border-border p-3">
                  <p className="text-sm text-muted-foreground">No mother vessel calls match.</p>
                  <Button type="button" variant="secondary" size="sm" asChild>
                    <Link href="/vessel-calls">Open vessel calls</Link>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Create or adjust port visits under Vessel calls, then return here.
                  </p>
                </div>
              ) : (
                <ul className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-border p-2">
                  {rows.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => setVesselCallId(r.id)}
                        className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                          vesselCallId === r.id
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:bg-muted/60"
                        }`}
                      >
                        <div className="font-medium">{r.vessel.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.callNo} · {r.status}
                          {r.cargoNameSnapshot ? ` · ${r.cargoNameSnapshot}` : ""}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {callsQ.hasNextPage ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={callsQ.isFetchingNextPage}
                  onClick={() => void callsQ.fetchNextPage()}
                >
                  {callsQ.isFetchingNextPage ? "Loading…" : "Load more"}
                </Button>
              ) : null}
            </section>

            <section className="space-y-2">
              <Label htmlFor="assign-remarks">Remarks (optional)</Label>
              <Input
                id="assign-remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Assignment note…"
              />
            </section>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="mt-auto flex gap-2 border-t border-border pt-4">
              <Button
                type="button"
                disabled={!vesselCallId || createM.isPending}
                onClick={() => {
                  setError(null);
                  if (!vesselCallId) {
                    setError("Choose a mother vessel call.");
                    return;
                  }
                  void createM.mutate();
                }}
              >
                {createM.isPending ? "Assigning…" : "Assign to mother"}
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
