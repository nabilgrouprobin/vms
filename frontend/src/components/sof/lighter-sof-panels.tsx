"use client";

import { ChevronDown } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SofDetailGrid } from "@/components/sof/sof-detail-grid";
import { formatDt, formatNum } from "@/lib/format";
import { formatDecimalHoursToHMin } from "@/lib/laytime-hours-format";

import {
  MotherVesselOverviewPanel,
  type LatestSofEventMetrics,
  type MotherVesselCallDetail
} from "./mother-vessel-panels";

/** Matches `lighterTrip` on lighter SOF detail API include */
export type LighterTripDetail = {
  id: string;
  tripNo: string;
  status: string;
  assignedAt: string | null;
  alongsideDate: string | null;
  loadingStartedAt: string | null;
  loadingCompletedAt: string | null;
  departedMvDate: string | null;
  arrivedGhatDate: string | null;
  unloadStartedAt: string | null;
  unloadCompletedAt: string | null;
  lighterVessel: {
    id: string;
    name: string;
    imoNo: string | null;
    flag: string | null;
    vesselType: string | null;
    deadweightTon: string | null;
    maxDraftMeters: string | null;
    lengthOverallM: string | null;
    beamM: string | null;
    yearBuilt: number | null;
    isLighter: boolean;
  };
  vesselCall: MotherVesselCallDetail;
};

function LighterVesselRegistryPanel({
  lighterVessel
}: {
  lighterVessel: LighterTripDetail["lighterVessel"];
}) {
  const v = lighterVessel;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Lighter vessel (registry)</CardTitle>
        <CardDescription className="text-xs">
          {v.name} — same registry coverage as the mother vessel block on a mother SOF.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
          <dl className="grid gap-x-3 gap-y-2 text-xs sm:grid-cols-2 md:grid-cols-3">
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Name</dt>
              <dd className="font-semibold">{v.name}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">IMO</dt>
              <dd className="font-medium">{formatNum(v.imoNo)}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Flag</dt>
              <dd className="font-medium">{formatNum(v.flag)}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Deadweight (MT)
              </dt>
              <dd className="font-medium">{formatNum(v.deadweightTon)}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                isLighter
              </dt>
              <dd className="font-medium">{v.isLighter ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </div>

        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-left text-sm font-medium hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
            <span>Full lighter vessel fields (vessels)</span>
            <ChevronDown
              className="size-4 shrink-0 transition-transform duration-200"
              aria-hidden
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <SofDetailGrid
              columns={3}
              rows={[
                { label: "name", value: v.name },
                { label: "imoNo", value: formatNum(v.imoNo) },
                { label: "flag", value: formatNum(v.flag) },
                { label: "vesselType", value: formatNum(v.vesselType) },
                { label: "deadweightTon", value: formatNum(v.deadweightTon) },
                { label: "maxDraftMeters", value: formatNum(v.maxDraftMeters) },
                { label: "lengthOverallM", value: formatNum(v.lengthOverallM) },
                { label: "beamM", value: formatNum(v.beamM) },
                { label: "yearBuilt", value: v.yearBuilt != null ? String(v.yearBuilt) : "—" },
                { label: "isLighter", value: v.isLighter ? "Yes" : "No" }
              ]}
            />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

export function LighterTripOverviewPanel({
  lighterTrip
}: {
  lighterTrip: LighterTripDetail | null | undefined;
}) {
  if (!lighterTrip) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lighter trip</CardTitle>
          <CardDescription>No trip is linked to this SOF.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const lv = lighterTrip.lighterVessel;
  const vc = lighterTrip.vesselCall;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lighter trip (read-only)</CardTitle>
          <CardDescription className="text-xs">
            Trip {lighterTrip.tripNo} · {lv.name} · Mother {vc.vessel.name} ({vc.callNo})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
            <dl className="grid gap-x-3 gap-y-2 text-xs sm:grid-cols-2 md:grid-cols-3">
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Trip status
                </dt>
                <dd className="font-semibold">{lighterTrip.status}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Lighter
                </dt>
                <dd className="font-medium">{lv.name}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Mother vessel · call
                </dt>
                <dd className="font-medium break-words">
                  {vc.vessel.name} · {vc.callNo}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Call status
                </dt>
                <dd className="font-medium">{vc.status}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Call discharge (MT)
                </dt>
                <dd className="font-medium">{formatNum(vc.totalDischargeMt)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Lighter IMO
                </dt>
                <dd className="font-medium">{formatNum(lv.imoNo)}</dd>
              </div>
            </dl>
          </div>

          <Collapsible defaultOpen={false}>
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-left text-sm font-medium hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
              <span>Full trip timeline &amp; milestones</span>
              <ChevronDown
                className="size-4 shrink-0 transition-transform duration-200"
                aria-hidden
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-4">
              <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["assignedAt", formatDt(lighterTrip.assignedAt)],
                  ["alongsideDate", formatDt(lighterTrip.alongsideDate)],
                  ["loadingStartedAt", formatDt(lighterTrip.loadingStartedAt)],
                  ["loadingCompletedAt", formatDt(lighterTrip.loadingCompletedAt)],
                  ["departedMvDate", formatDt(lighterTrip.departedMvDate)],
                  ["arrivedGhatDate", formatDt(lighterTrip.arrivedGhatDate)],
                  ["unloadStartedAt", formatDt(lighterTrip.unloadStartedAt)],
                  ["unloadCompletedAt", formatDt(lighterTrip.unloadCompletedAt)]
                ].map(([label, value]) => (
                  <div key={String(label)} className="space-y-0.5">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="font-medium break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <MotherVesselOverviewPanel vesselCall={vc} />
      <LighterVesselRegistryPanel lighterVessel={lv} />
    </div>
  );
}

export function LighterSofEventsContextPanel({
  lighterTrip,
  laytimeBalanceHours,
  latestEvent
}: {
  lighterTrip: LighterTripDetail | null | undefined;
  laytimeBalanceHours: string | null | undefined;
  latestEvent: LatestSofEventMetrics;
}) {
  if (!lighterTrip) {
    return null;
  }

  const vc = lighterTrip.vesselCall;
  const cells: Array<{ label: string; value: string }> = [
    { label: "Trip", value: `${lighterTrip.tripNo} · ${lighterTrip.status}` },
    { label: "Lighter", value: lighterTrip.lighterVessel.name },
    { label: "Mother / call", value: `${vc.vessel.name} (${vc.callNo})` },
    {
      label: "Call discharge (MT)",
      value: formatNum(vc.totalDischargeMt)
    },
    {
      label: "Laytime balance",
      value: formatDecimalHoursToHMin(laytimeBalanceHours)
    }
  ];

  if (latestEvent) {
    cells.push(
      { label: "Latest event time", value: formatDt(latestEvent.eventTime) },
      {
        label: "Latest cumul. / ROB / interval MT",
        value: `${formatNum(latestEvent.cumulativeDischargeMt)} · ${formatNum(latestEvent.robQuantityMt)} · ${formatNum(latestEvent.dischargeQuantityMt)}`
      }
    );
  }

  return (
    <div className="rounded-md border border-primary/20 bg-muted/20 px-3 py-2">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Trip &amp; latest event context
      </p>
      <dl className="grid gap-x-3 gap-y-2 text-xs sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cells.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
            <dd className="font-medium leading-snug break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
