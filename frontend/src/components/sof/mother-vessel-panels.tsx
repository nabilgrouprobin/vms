"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SofDetailGrid } from "@/components/sof/sof-detail-grid";
import { formatDt, formatNum } from "@/lib/format";
import { formatDecimalHoursToHMin } from "@/lib/laytime-hours-format";
import { approxOutstandingMt, hoursRelativeToNow } from "@/lib/sof-display-utils";
import { DEFAULT_LAYTIME_IANA_ZONE, formatGmtOffsetForZone } from "@/lib/timezone-gmt";

/** Matches `vesselCall` on mother SOF detail API after expanded select */
export type MotherVesselCallDetail = {
  id: string;
  callNo: string;
  status: string;
  eta: string | null;
  etd: string | null;
  ata: string | null;
  atd: string | null;
  anchorDroppedAt: string | null;
  norTenderedAt: string | null;
  norAcceptedAt: string | null;
  norRejectedAt: string | null;
  norNumber: string | null;
  laytimeTimeZone: string | null;
  laytimeCommenceAt: string | null;
  readyToDischargeAt: string | null;
  dischargeStartedAt: string | null;
  dischargeCompletedAt: string | null;
  anchorUpAt: string | null;
  cargoNameSnapshot: string | null;
  approxTotalWeightTon: string | null;
  toleranceMinusPct: string | null;
  tolerancePlusPct: string | null;
  holdReason: string | null;
  currentAnchorage: string | null;
  isAnchored: boolean | null;
  isAlongside: boolean | null;
  totalStages: number;
  completedStages: number;
  lastStageCompletedAt: string | null;
  nextStageExpectedAt: string | null;
  anchorageDischargeMt: string | null;
  alongsideDischargeMt: string | null;
  totalDischargeMt: string | null;
  createdAt: string;
  updatedAt: string;
  arrivalLocation: { id: string; name: string; type: string } | null;
  cnf: { name: string } | null;
  importContract: {
    id: string;
    contractNo: string;
    dischargeRateMtPerDay: string | null;
    dischargeRateUnit: string | null;
    currency: string | null;
    dischargePort: string | null;
    excludedDays: string[];
    holidaysExcluded: boolean | null;
    excludedTimePeriod: string | null;
    laytimeDemurrageRatePerDay: string | null;
    laytimeDispatchRatePerDay: string | null;
  } | null;
  vessel: {
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
    isMotherVessel: boolean;
  };
  _count?: {
    lighterTrips: number;
    lighterAssignments: number;
  };
};

export function MotherVesselOverviewPanel({
  vesselCall
}: {
  vesselCall: MotherVesselCallDetail | null | undefined;
}) {
  if (!vesselCall) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mother vessel · vessel call</CardTitle>
          <CardDescription>No vessel call is linked to this SOF.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const v = vesselCall.vessel;
  const loc = vesselCall.arrivalLocation;
  const ic = vesselCall.importContract;
  const layTzIana = vesselCall.laytimeTimeZone?.trim() || DEFAULT_LAYTIME_IANA_ZONE;
  const layTzGmt = formatGmtOffsetForZone(layTzIana);
  const layTzDisplay =
    layTzGmt && vesselCall.laytimeTimeZone?.trim()
      ? `${layTzIana} · ${layTzGmt}`
      : layTzGmt
        ? `${layTzIana} (default) · ${layTzGmt}`
        : `${layTzIana}${vesselCall.laytimeTimeZone?.trim() ? "" : " (default)"}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Vessel &amp; call details</CardTitle>
        <CardDescription className="text-xs">
          Call {vesselCall.callNo} · {v.name} — expand for full database fields.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
          <dl className="grid gap-x-3 gap-y-2 text-xs sm:grid-cols-2 md:grid-cols-3">
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Status</dt>
              <dd className="font-semibold">{vesselCall.status}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Cargo</dt>
              <dd className="font-medium break-words">{formatNum(vesselCall.cargoNameSnapshot)}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Location
              </dt>
              <dd className="font-medium">{loc ? `${loc.name}` : "—"}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Approx total / discharged
              </dt>
              <dd className="font-medium">
                {formatNum(vesselCall.approxTotalWeightTon)} /{" "}
                {formatNum(vesselCall.totalDischargeMt)} MT
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Outstanding
              </dt>
              <dd className="font-medium">
                {approxOutstandingMt(vesselCall.approxTotalWeightTon, vesselCall.totalDischargeMt)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                ETA · ETD
              </dt>
              <dd className="font-medium">
                {formatDt(vesselCall.eta)} · {formatDt(vesselCall.etd)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Laytime zone
              </dt>
              <dd className="font-medium font-mono text-xs">{layTzDisplay}</dd>
            </div>
            {ic ? (
              <div className="sm:col-span-2 md:col-span-3">
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Contract laytime
                </dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Excluded days: {(ic.excludedDays ?? []).join(", ") || "—"}
                  </span>
                  <Link
                    href={`/import-contracts/${ic.id}`}
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Edit contract terms
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-left text-sm font-medium hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
            <span>Full vessel, call, NOR &amp; contract fields</span>
            <ChevronDown
              className="size-4 shrink-0 transition-transform duration-200"
              aria-hidden
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-6 pt-4">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Vessel (vessels)
              </h3>
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
                  { label: "isMotherVessel", value: v.isMotherVessel ? "Yes" : "No" }
                ]}
              />
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Call &amp; berth (vessel_calls)
              </h3>
              <SofDetailGrid
                columns={3}
                rows={[
                  { label: "callNo", value: vesselCall.callNo },
                  { label: "status", value: vesselCall.status },
                  { label: "eta", value: formatDt(vesselCall.eta) },
                  { label: "etd", value: formatDt(vesselCall.etd) },
                  { label: "ata", value: formatDt(vesselCall.ata) },
                  { label: "atd", value: formatDt(vesselCall.atd) },
                  {
                    label: "arrivalLocation",
                    value: loc ? `${loc.name} (${loc.type})` : "—"
                  },
                  { label: "currentAnchorage", value: formatNum(vesselCall.currentAnchorage) },
                  {
                    label: "isAnchored / isAlongside",
                    value: `${vesselCall.isAnchored === true ? "Y" : "N"} / ${vesselCall.isAlongside === true ? "Y" : "N"}`
                  },
                  { label: "cargoNameSnapshot", value: formatNum(vesselCall.cargoNameSnapshot) },
                  {
                    label: "approxTotalWeightTon",
                    value: formatNum(vesselCall.approxTotalWeightTon)
                  },
                  { label: "toleranceMinusPct", value: formatNum(vesselCall.toleranceMinusPct) },
                  { label: "tolerancePlusPct", value: formatNum(vesselCall.tolerancePlusPct) },
                  {
                    label: "anchorageDischargeMt",
                    value: formatNum(vesselCall.anchorageDischargeMt)
                  },
                  {
                    label: "alongsideDischargeMt",
                    value: formatNum(vesselCall.alongsideDischargeMt)
                  },
                  { label: "totalDischargeMt", value: formatNum(vesselCall.totalDischargeMt) },
                  {
                    label: "approx outstanding (approxTotalWeightTon − totalDischargeMt)",
                    value: approxOutstandingMt(
                      vesselCall.approxTotalWeightTon,
                      vesselCall.totalDischargeMt
                    )
                  },
                  {
                    label: "totalStages / completedStages",
                    value: `${vesselCall.completedStages} / ${vesselCall.totalStages}`
                  },
                  {
                    label: "lastStageCompletedAt",
                    value: formatDt(vesselCall.lastStageCompletedAt)
                  },
                  { label: "nextStageExpectedAt", value: formatDt(vesselCall.nextStageExpectedAt) },
                  { label: "holdReason", value: formatNum(vesselCall.holdReason) }
                ]}
              />
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                NOR &amp; discharge milestones
              </h3>
              <SofDetailGrid
                columns={3}
                rows={[
                  { label: "norNumber", value: formatNum(vesselCall.norNumber) },
                  { label: "norTenderedAt", value: formatDt(vesselCall.norTenderedAt) },
                  { label: "norAcceptedAt", value: formatDt(vesselCall.norAcceptedAt) },
                  { label: "norRejectedAt", value: formatDt(vesselCall.norRejectedAt) },
                  { label: "laytimeTimeZone", value: formatNum(vesselCall.laytimeTimeZone) },
                  { label: "laytimeCommenceAt", value: formatDt(vesselCall.laytimeCommenceAt) },
                  { label: "anchorDroppedAt", value: formatDt(vesselCall.anchorDroppedAt) },
                  { label: "readyToDischargeAt", value: formatDt(vesselCall.readyToDischargeAt) },
                  { label: "dischargeStartedAt", value: formatDt(vesselCall.dischargeStartedAt) },
                  {
                    label: "dischargeCompletedAt",
                    value: formatDt(vesselCall.dischargeCompletedAt)
                  },
                  { label: "anchorUpAt", value: formatDt(vesselCall.anchorUpAt) }
                ]}
              />
            </div>

            {ic ? (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Import contract (import_contracts)
                </h3>
                <SofDetailGrid
                  columns={3}
                  rows={[
                    { label: "contractNo", value: ic.contractNo },
                    { label: "dischargePort", value: formatNum(ic.dischargePort) },
                    { label: "dischargeRateMtPerDay", value: formatNum(ic.dischargeRateMtPerDay) },
                    { label: "dischargeRateUnit", value: formatNum(ic.dischargeRateUnit) },
                    { label: "excludedDays", value: (ic.excludedDays ?? []).join(", ") || "—" },
                    {
                      label: "holidaysExcluded",
                      value: ic.holidaysExcluded == null ? "—" : String(ic.holidaysExcluded)
                    },
                    { label: "excludedTimePeriod", value: formatNum(ic.excludedTimePeriod) },
                    {
                      label: "laytimeDemurrageRatePerDay",
                      value: formatNum(ic.laytimeDemurrageRatePerDay)
                    },
                    {
                      label: "laytimeDispatchRatePerDay",
                      value: formatNum(ic.laytimeDispatchRatePerDay)
                    },
                    { label: "currency", value: formatNum(ic.currency) }
                  ]}
                />
              </div>
            ) : null}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

export type LatestSofEventMetrics = {
  eventTime: string;
  cumulativeDischargeMt: string | null;
  robQuantityMt: string | null;
  dischargeQuantityMt: string | null;
} | null;

export function MotherVesselEventsContextPanel({
  vesselCall,
  laytimeBalanceHours,
  latestEvent,
  compact = false
}: {
  vesselCall: MotherVesselCallDetail | null | undefined;
  laytimeBalanceHours: string | null | undefined;
  latestEvent: LatestSofEventMetrics;
  compact?: boolean;
}) {
  if (!vesselCall) {
    return null;
  }

  if (compact) {
    const cells: Array<{ label: string; value: string }> = [
      {
        label: "Call status",
        value: vesselCall.status
      },
      {
        label: "ETD",
        value: `${formatDt(vesselCall.etd)} · ${hoursRelativeToNow(vesselCall.etd)}`
      },
      {
        label: "Next stage",
        value: `${formatDt(vesselCall.nextStageExpectedAt)} · ${hoursRelativeToNow(vesselCall.nextStageExpectedAt)}`
      },
      {
        label: "Discharged / approx total",
        value: `${formatNum(vesselCall.totalDischargeMt)} / ${formatNum(vesselCall.approxTotalWeightTon)} MT`
      },
      {
        label: "Outstanding",
        value: approxOutstandingMt(vesselCall.approxTotalWeightTon, vesselCall.totalDischargeMt)
      },
      {
        label: "Laytime balance",
        value: formatDecimalHoursToHMin(laytimeBalanceHours)
      }
    ];
    if (latestEvent) {
      cells.push(
        {
          label: "Latest event time",
          value: formatDt(latestEvent.eventTime)
        },
        {
          label: "Latest cumul. / ROB / interval MT",
          value: `${formatNum(latestEvent.cumulativeDischargeMt)} · ${formatNum(latestEvent.robQuantityMt)} · ${formatNum(latestEvent.dischargeQuantityMt)}`
        }
      );
    }
    return (
      <div className="rounded-md border border-primary/20 bg-muted/20 px-3 py-2">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Call &amp; latest event context
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

  const rows: Array<{ label: string; value: string }> = [
    {
      label: "etd (hours vs now)",
      value: `${formatDt(vesselCall.etd)} · ${hoursRelativeToNow(vesselCall.etd)}`
    },
    {
      label: "nextStageExpectedAt",
      value: `${formatDt(vesselCall.nextStageExpectedAt)} · ${hoursRelativeToNow(vesselCall.nextStageExpectedAt)}`
    },
    { label: "approxTotalWeightTon", value: formatNum(vesselCall.approxTotalWeightTon) },
    { label: "totalDischargeMt", value: formatNum(vesselCall.totalDischargeMt) },
    {
      label: "approx outstanding (approxTotalWeightTon − totalDischargeMt)",
      value: approxOutstandingMt(vesselCall.approxTotalWeightTon, vesselCall.totalDischargeMt)
    },
    {
      label: "laytimeBalanceHours (statement_of_facts)",
      value: formatDecimalHoursToHMin(laytimeBalanceHours)
    }
  ];

  if (latestEvent) {
    rows.push(
      {
        label: "Latest sof_events.eventTime",
        value: formatDt(latestEvent.eventTime)
      },
      {
        label: "Latest cumulativeDischargeMt",
        value: formatNum(latestEvent.cumulativeDischargeMt)
      },
      { label: "Latest robQuantityMt", value: formatNum(latestEvent.robQuantityMt) },
      {
        label: "Latest dischargeQuantityMt",
        value: formatNum(latestEvent.dischargeQuantityMt)
      }
    );
  }

  return (
    <Card className="border-primary/20 bg-muted/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Vessel call context for events</CardTitle>
        <CardDescription>
          Quantities and times from <code className="text-xs">vessel_calls</code>, laytime from SOF,
          latest logged event figures from <code className="text-xs">sof_events</code>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SofDetailGrid rows={rows} columns={3} />
      </CardContent>
    </Card>
  );
}
