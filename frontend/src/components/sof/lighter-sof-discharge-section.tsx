"use client";

import { useQuery } from "@tanstack/react-query";

import { MotherCallDischargeSection } from "@/components/sof/mother-call-discharge-section";
import type { MotherVesselCallDetail } from "@/components/sof/mother-vessel-panels";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMotherSofs } from "@/lib/sof-api";

export function LighterSofDischargeSection({
  vesselCallId,
  callNo,
  vesselCallDetail
}: {
  vesselCallId: string | undefined;
  callNo: string | undefined;
  vesselCallDetail?: MotherVesselCallDetail | null;
}) {
  const resolveQ = useQuery({
    queryKey: ["mother-sof-for-vessel-call", vesselCallId],
    enabled: !!vesselCallId && !!callNo,
    queryFn: async () => {
      const page = await fetchMotherSofs({ search: callNo, limit: 40 });
      const row = page.data.find((r) => r.vesselCall?.id === vesselCallId);
      return row?.id ?? null;
    }
  });

  const motherSofId = resolveQ.data;

  if (!vesselCallId || !callNo) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          Link a trip with a mother vessel call to view discharge and reports for that call.
        </CardContent>
      </Card>
    );
  }

  if (resolveQ.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (!motherSofId) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          No mother vessel SOF found for call {callNo}. Create a mother vessel SOF for this call to
          record daily discharge and reports.
        </CardContent>
      </Card>
    );
  }

  return (
    <MotherCallDischargeSection
      motherSofId={motherSofId}
      vesselCall={vesselCallDetail ?? null}
      vesselCallId={vesselCallDetail?.id ?? vesselCallId}
      showOpenReportsLink
    />
  );
}
