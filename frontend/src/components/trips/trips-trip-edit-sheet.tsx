"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchLighterTripDetail,
  patchLighterTrip,
  type PatchLighterTripBody
} from "@/lib/lighter-trips-api";
import { parseApiErr } from "@/lib/parse-api-error";

type Props = {
  tripId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Invalidate list for this mother call and/or lighter hull after save */
  invalidateKeys: Array<readonly string[]>;
};

function fromLocalInput(v: string): string | null {
  if (!v.trim()) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function TripsTripEditSheet({ tripId, open, onOpenChange, invalidateKeys }: Props) {
  const qc = useQueryClient();
  const [remarks, setRemarks] = useState("");
  const [holdReason, setHoldReason] = useState("");
  const [carrierConfirmedAt, setCarrierConfirmedAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const detailQ = useQuery({
    queryKey: ["lighter-trip-detail", tripId],
    queryFn: () => fetchLighterTripDetail(tripId!),
    enabled: open && !!tripId
  });

  useEffect(() => {
    const d = detailQ.data;
    if (d) {
      setRemarks(d.remarks ?? "");
      setHoldReason(d.holdReason ?? "");
      setCarrierConfirmedAt("");
    }
  }, [detailQ.data]);

  useEffect(() => {
    if (!open) setError(null);
  }, [open]);

  const saveM = useMutation({
    mutationFn: () => {
      const body: PatchLighterTripBody = {
        remarks: remarks.trim() || null,
        holdReason: holdReason.trim() || null
      };
      if (carrierConfirmedAt.trim()) {
        body.carrierConfirmedAt = fromLocalInput(carrierConfirmedAt);
      }
      return patchLighterTrip(tripId!, body);
    },
    onSuccess: async () => {
      for (const key of invalidateKeys) {
        await qc.invalidateQueries({ queryKey: key });
      }
      await qc.invalidateQueries({ queryKey: ["lighter-trip-detail", tripId] });
      onOpenChange(false);
    },
    onError: (e) => setError(parseApiErr(e))
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetTitle>Edit trip</SheetTitle>
        <SheetDescription>
          Update remarks, hold reason, and carrier confirmation time.
        </SheetDescription>

        {!tripId ? null : detailQ.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : detailQ.isError ? (
          <p className="text-sm text-destructive">{parseApiErr(detailQ.error)}</p>
        ) : (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1 pt-4">
            <p className="text-sm text-muted-foreground">
              Trip <span className="font-medium text-foreground">{detailQ.data?.tripNo}</span> ·{" "}
              {detailQ.data?.status}
            </p>
            <div className="space-y-2">
              <Label htmlFor="ed-remarks">Remarks</Label>
              <Input
                id="ed-remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Operational remarks…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-hold">Hold reason</Label>
              <Input
                id="ed-hold"
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                placeholder="Clear by saving empty…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-cc">Carrier confirmed at</Label>
              <Input
                id="ed-cc"
                type="datetime-local"
                value={carrierConfirmedAt}
                onChange={(e) => setCarrierConfirmedAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to skip. Set to record carrier acceptance on the linked allocation.
              </p>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="mt-auto flex gap-2 border-t border-border pt-4">
              <Button
                type="button"
                disabled={saveM.isPending}
                onClick={() => {
                  setError(null);
                  void saveM.mutate();
                }}
              >
                {saveM.isPending ? "Saving…" : "Save"}
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
