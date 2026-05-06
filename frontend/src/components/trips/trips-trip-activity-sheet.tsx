"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchLighterTripDetail, patchLighterTrip } from "@/lib/lighter-trips-api";
import { parseApiErr } from "@/lib/parse-api-error";
import { cn } from "@/lib/utils";
import { LIGHTER_TRIP_STATUSES } from "@/types/vms";

type Props = {
  tripId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invalidateKeys: Array<readonly string[]>;
};

function labelStatus(s: string): string {
  return s
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function TripsTripActivitySheet({ tripId, open, onOpenChange, invalidateKeys }: Props) {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [statusChangeRemarks, setStatusChangeRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);

  const detailQ = useQuery({
    queryKey: ["lighter-trip-detail", tripId],
    queryFn: () => fetchLighterTripDetail(tripId!),
    enabled: open && !!tripId
  });

  useEffect(() => {
    const d = detailQ.data;
    if (d) {
      setStatus(d.status);
      setStatusChangeRemarks("");
    }
  }, [detailQ.data]);

  useEffect(() => {
    if (!open) setError(null);
  }, [open]);

  const saveM = useMutation({
    mutationFn: () =>
      patchLighterTrip(tripId!, {
        status,
        statusChangeRemarks: statusChangeRemarks.trim() || null
      }),
    onSuccess: async () => {
      for (const key of invalidateKeys) {
        await qc.invalidateQueries({ queryKey: key });
      }
      await qc.invalidateQueries({ queryKey: ["lighter-trip-detail", tripId] });
      await qc.invalidateQueries({ queryKey: ["lighter-hulls-picker"] });
      onOpenChange(false);
    },
    onError: (e) => setError(parseApiErr(e))
  });

  const current = detailQ.data?.status;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetTitle>Activity / status</SheetTitle>
        <SheetDescription>
          Change operational trip status. Closing or unloading states frees the lighter hull for a
          new mother assignment when the trip is finished.
        </SheetDescription>

        {!tripId ? null : detailQ.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : detailQ.isError ? (
          <p className="text-sm text-destructive">{parseApiErr(detailQ.error)}</p>
        ) : (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1 pt-4">
            <p className="text-sm text-muted-foreground">
              Trip <span className="font-medium text-foreground">{detailQ.data?.tripNo}</span>
              {current ? (
                <>
                  {" "}
                  · Current: <span className="font-medium text-foreground">{current}</span>
                </>
              ) : null}
            </p>
            <div className="space-y-2">
              <Label htmlFor="act-status">New status</Label>
              <select
                id="act-status"
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {LIGHTER_TRIP_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {labelStatus(s)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="act-remarks">Status change note</Label>
              <Input
                id="act-remarks"
                value={statusChangeRemarks}
                onChange={(e) => setStatusChangeRemarks(e.target.value)}
                placeholder="Optional log text for this transition…"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="mt-auto flex gap-2 border-t border-border pt-4">
              <Button
                type="button"
                disabled={saveM.isPending || !status}
                onClick={() => {
                  setError(null);
                  void saveM.mutate();
                }}
              >
                {saveM.isPending ? "Updating…" : "Update status"}
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
