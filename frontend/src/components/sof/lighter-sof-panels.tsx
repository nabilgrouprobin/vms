"use client";

import {
  Anchor,
  CheckCircle2,
  ChevronDown,
  Circle,
  Flag,
  PackageOpen,
  Route,
  Ruler,
  Ship,
  Waves
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SofDetailGrid } from "@/components/sof/sof-detail-grid";
import { formatDt, formatNum } from "@/lib/format";
import { formatDecimalHoursToHMin } from "@/lib/laytime-hours-format";
import { cn } from "@/lib/utils";

import {
  MotherVesselOverviewPanel,
  type LatestSofEventMetrics,
  type MotherVesselCallDetail
} from "./mother-vessel-panels";

function lighterTripStatusVariant(
  status: string
): "default" | "secondary" | "outline" | "success" | "warning" {
  if (status === "UNLOADED" || status === "CLOSED") return "success";
  if (status === "ON_HOLD" || status === "CANCELLED" || status === "NOT_READY") return "warning";
  if (status === "LOADING" || status === "UNLOADING" || status === "PARTIAL_UNLOADED") {
    return "default";
  }
  if (status === "PLANNED" || status === "ASSIGNED") return "outline";
  return "secondary";
}

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
    <Card className="overflow-hidden">
      <div className="border-b border-border bg-gradient-to-r from-sky-500/10 via-card to-card px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
            <Waves className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold tracking-tight">{v.name}</h3>
              {v.isLighter ? (
                <Badge variant="secondary" className="text-[10px]">
                  Lighter
                </Badge>
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Lighter vessel registry
              {v.imoNo ? <span> · IMO {v.imoNo}</span> : null}
              {v.flag ? (
                <>
                  {" "}
                  ·{" "}
                  <span className="inline-flex items-center gap-1 align-middle">
                    <Flag className="size-3" />
                    {v.flag}
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      <CardContent className="space-y-3 pt-4">
        <div className="rounded-md border border-border/70 bg-muted/20 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Ruler className="size-3.5" /> Specifications
          </p>
          <dl className="grid gap-x-3 gap-y-2 text-xs sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {[
              { label: "Type", value: formatNum(v.vesselType) },
              { label: "Year built", value: v.yearBuilt != null ? String(v.yearBuilt) : "—" },
              { label: "DWT (MT)", value: formatNum(v.deadweightTon) },
              { label: "LOA (m)", value: formatNum(v.lengthOverallM) },
              { label: "Beam (m)", value: formatNum(v.beamM) },
              { label: "Max draft (m)", value: formatNum(v.maxDraftMeters) }
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {label}
                </dt>
                <dd className="mt-0.5 font-medium">{value}</dd>
              </div>
            ))}
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

type TripMilestone = { label: string; iso: string | null };

function TripMilestoneStrip({ steps }: { steps: TripMilestone[] }) {
  return (
    <ol className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
      {steps.map((s, i) => {
        const done = !!s.iso;
        const Icon = done ? CheckCircle2 : Circle;
        return (
          <li
            key={`${s.label}-${i}`}
            className={cn(
              "flex items-start gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors",
              done
                ? "border-sky-500/30 bg-sky-500/5"
                : "border-dashed border-border bg-muted/20 text-muted-foreground"
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 size-3.5 shrink-0",
                done ? "text-sky-600 dark:text-sky-400" : "text-muted-foreground/60"
              )}
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate text-[10px] font-medium uppercase tracking-wide",
                  done ? "text-foreground/80" : "text-muted-foreground"
                )}
              >
                {s.label}
              </p>
              <p
                className={cn(
                  "mt-0.5 font-mono text-[11px] leading-snug",
                  done ? "text-foreground" : "text-muted-foreground/70"
                )}
              >
                {formatDt(s.iso)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
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

  const milestones: TripMilestone[] = [
    { label: "Assigned", iso: lighterTrip.assignedAt },
    { label: "Alongside MV", iso: lighterTrip.alongsideDate },
    { label: "Loading started", iso: lighterTrip.loadingStartedAt },
    { label: "Loading completed", iso: lighterTrip.loadingCompletedAt },
    { label: "Departed MV", iso: lighterTrip.departedMvDate },
    { label: "Arrived ghat", iso: lighterTrip.arrivedGhatDate },
    { label: "Unload started", iso: lighterTrip.unloadStartedAt },
    { label: "Unload completed", iso: lighterTrip.unloadCompletedAt }
  ];

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="border-b border-border bg-gradient-to-r from-sky-500/10 via-card to-card px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
                <Waves className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-semibold tracking-tight">
                    {lv.name}
                  </h2>
                  <Badge variant={lighterTripStatusVariant(lighterTrip.status)}>
                    {lighterTrip.status}
                  </Badge>
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 truncate text-xs text-muted-foreground">
                  <Route className="size-3" />
                  <span className="font-mono text-foreground/80">Trip {lighterTrip.tripNo}</span>
                  <span>·</span>
                  <Ship className="size-3" />
                  <span>
                    {vc.vessel.name}{" "}
                    <span className="font-mono text-foreground/70">({vc.callNo})</span>
                  </span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <Badge variant="outline" className="gap-1">
                <Anchor className="size-3" />
                Call {vc.status}
              </Badge>
              {vc.cargoNameSnapshot ? (
                <Badge variant="secondary" className="gap-1">
                  <PackageOpen className="size-3" />
                  {vc.cargoNameSnapshot}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <CardContent className="space-y-4 pt-4">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-border bg-card px-3 py-2.5 shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Lighter IMO
              </p>
              <p className="mt-1 truncate font-mono text-sm font-semibold">
                {formatNum(lv.imoNo)}
              </p>
            </div>
            <div className="rounded-md border border-border bg-card px-3 py-2.5 shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                DWT
              </p>
              <p className="mt-1 truncate text-sm font-semibold">
                {formatNum(lv.deadweightTon)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">MT</span>
              </p>
            </div>
            <div className="rounded-md border border-border bg-card px-3 py-2.5 shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Mother call discharge
              </p>
              <p className="mt-1 truncate text-sm font-semibold">
                {formatNum(vc.totalDischargeMt)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">MT</span>
              </p>
            </div>
            <div className="rounded-md border border-border bg-card px-3 py-2.5 shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Flag · Year
              </p>
              <p className="mt-1 truncate text-sm font-semibold">
                {formatNum(lv.flag)}
                <span className="text-muted-foreground"> · </span>
                {lv.yearBuilt != null ? lv.yearBuilt : "—"}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Route className="size-3.5" /> Trip milestones
            </p>
            <TripMilestoneStrip steps={milestones} />
          </div>
        </CardContent>
      </Card>

      <LighterVesselRegistryPanel lighterVessel={lv} />
      <MotherVesselOverviewPanel vesselCall={vc} />
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
