"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchLighterTrips } from "@/lib/lighter-trips-api";
import { parseApiErr } from "@/lib/parse-api-error";
import { createLighterSof, createMotherSof } from "@/lib/sof-api";
import { toast } from "@/lib/toast";
import { buildVesselSofWorkspaceUrl } from "@/lib/workspace-paths";

type VesselSofAddEventEmptyStateProps = {
  kind: "mother" | "lighter";
  vesselCallId: string;
  lighterCallId: string;
  pathname: string;
  sectionLabel: string;
};

export function VesselSofAddEventEmptyState({
  kind,
  vesselCallId,
  lighterCallId,
  pathname,
  sectionLabel
}: VesselSofAddEventEmptyStateProps) {
  const router = useRouter();
  const qc = useQueryClient();

  const createMut = useMutation({
    mutationFn: async () => {
      if (kind === "mother") {
        if (!vesselCallId) throw new Error("No vessel call selected.");
        const data = (await createMotherSof({
          vesselCallId,
          status: "DRAFT"
        })) as { id?: string };
        if (!data?.id) throw new Error("SOF was created but no id was returned.");
        return { sofId: data.id, vesselCallId, lighterCallId: null as string | null };
      }
      const callId = lighterCallId.trim();
      if (!callId) throw new Error("No lighter port call selected.");
      const trips = await fetchLighterTrips({ vesselCallId: callId, limit: 25 });
      const withoutSof = trips.data.filter((t) => !t.statementOfFacts?.id);
      const pick = withoutSof[0] ?? trips.data[0];
      if (!pick) {
        throw new Error("No lighter trip on this call. Add a trip under Vessel calls first.");
      }
      const data = (await createLighterSof({
        lighterTripId: pick.id,
        status: "DRAFT"
      })) as { id?: string };
      if (!data?.id) throw new Error("SOF was created but no id was returned.");
      return { sofId: data.id, vesselCallId: null as string | null, lighterCallId: callId };
    },
    onSuccess: ({ sofId, vesselCallId: vc, lighterCallId: lc }) => {
      void qc.invalidateQueries({ queryKey: ["vessel-sof-mother-sof-probe"] });
      void qc.invalidateQueries({ queryKey: ["vessel-sof-lighter-sof-probe"] });
      void qc.invalidateQueries({ queryKey: ["mother-sof"] });
      void qc.invalidateQueries({ queryKey: ["lighter-sof"] });
      router.replace(
        buildVesselSofWorkspaceUrl(pathname, {
          kind,
          id: sofId,
          vesselCallId: vc,
          lighterCallId: lc,
          addEvent: "1"
        }),
        { scroll: false }
      );
    },
    onError: (e) => toast.error(parseApiErr(e))
  });

  const label =
    kind === "mother"
      ? "No statement of facts for this vessel call yet. Add an event to create the SOF and start recording times."
      : "No lighter SOF for this call yet. Add an event to create the SOF on the first available trip.";

  return (
    <Card className="w-full">
      <CardContent className="space-y-3 py-8 text-center text-sm">
        <p className="text-muted-foreground">{label}</p>
        <Button
          type="button"
          className="gap-2"
          disabled={createMut.isPending}
          onClick={() => createMut.mutate()}
        >
          <Plus className="size-4" aria-hidden />
          {createMut.isPending ? "Creating…" : "Add event"}
        </Button>
        {sectionLabel !== "SOF" ? (
          <p className="text-[11px] text-muted-foreground">
            You can add events on the SOF tab; other sections open after the SOF exists.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
