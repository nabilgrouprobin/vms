"use client";

import {
  Anchor,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  FileText,
  Flag,
  Gauge,
  Globe2,
  MapPin,
  Package,
  Ruler,
  Ship,
  Sigma,
  Timer
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SofDetailGrid } from "@/components/sof/sof-detail-grid";
import { formatDt, formatNum } from "@/lib/format";
import { formatDecimalHoursToHMin } from "@/lib/laytime-hours-format";
import { approxOutstandingMt, hoursRelativeToNow } from "@/lib/sof-display-utils";
import { DEFAULT_LAYTIME_IANA_ZONE, formatGmtOffsetForZone } from "@/lib/timezone-gmt";
import { cn } from "@/lib/utils";

function statusBadgeVariant(
  status: string
): "default" | "secondary" | "outline" | "success" | "warning" {
  if (status === "COMPLETED" || status === "CLOSED") return "success";
  if (status === "DISCHARGING" || status === "PARTIAL_DISCHARGED") return "default";
  if (status === "LC_HOLD" || status === "CANCELLED") return "warning";
  if (status === "EXPECTED") return "outline";
  return "secondary";
}

function parseNumOrNull(v: string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function dischargeProgressPct(
  approxTotal: string | null | undefined,
  discharged: string | null | undefined
): number | null {
  const a = parseNumOrNull(approxTotal);
  const d = parseNumOrNull(discharged);
  if (a == null || a <= 0 || d == null) return null;
  return Math.max(0, Math.min(100, (d / a) * 100));
}

type Milestone = { label: string; iso: string | null; tone?: "primary" | "muted" };

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  className
}: {
  icon: typeof Anchor;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card px-3 py-2.5 shadow-sm transition-colors",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" />
        <span>{label}</span>
      </div>
      <div className="mt-1 text-sm font-semibold leading-snug break-words">{value}</div>
      {hint ? (
        <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground break-words">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500"
        style={{ width: `${pct.toFixed(1)}%` }}
      />
    </div>
  );
}

function MilestoneStrip({ steps }: { steps: Milestone[] }) {
  return (
    <ol className="relative grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {steps.map((s, i) => {
        const done = !!s.iso;
        const Icon = done ? CheckCircle2 : Circle;
        return (
          <li
            key={`${s.label}-${i}`}
            className={cn(
              "flex items-start gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors",
              done
                ? "border-primary/30 bg-primary/5"
                : "border-dashed border-border bg-muted/20 text-muted-foreground"
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 size-3.5 shrink-0",
                done ? "text-primary" : "text-muted-foreground/60"
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
  const layTzIsDefault = !vesselCall.laytimeTimeZone?.trim();
  const dischargedPct = dischargeProgressPct(
    vesselCall.approxTotalWeightTon,
    vesselCall.totalDischargeMt
  );
  const outstanding = approxOutstandingMt(
    vesselCall.approxTotalWeightTon,
    vesselCall.totalDischargeMt
  );
  const tolerance =
    vesselCall.toleranceMinusPct || vesselCall.tolerancePlusPct
      ? `± ${formatNum(vesselCall.tolerancePlusPct)} / ${formatNum(vesselCall.toleranceMinusPct)} %`
      : null;

  const milestones: Milestone[] = [
    { label: "ETA", iso: vesselCall.eta },
    { label: "ATA", iso: vesselCall.ata },
    { label: "Anchor dropped", iso: vesselCall.anchorDroppedAt },
    { label: "NOR tendered", iso: vesselCall.norTenderedAt },
    { label: "NOR accepted", iso: vesselCall.norAcceptedAt },
    { label: "Ready to discharge", iso: vesselCall.readyToDischargeAt },
    { label: "Discharge started", iso: vesselCall.dischargeStartedAt },
    { label: "Discharge completed", iso: vesselCall.dischargeCompletedAt },
    { label: "Anchor up", iso: vesselCall.anchorUpAt },
    { label: "ATD", iso: vesselCall.atd }
  ];

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border bg-gradient-to-r from-primary/10 via-card to-card px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Ship className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold tracking-tight">{v.name}</h2>
                <Badge variant={statusBadgeVariant(vesselCall.status)}>{vesselCall.status}</Badge>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                <span className="font-mono text-foreground/80">{vesselCall.callNo}</span>
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
                {v.vesselType ? <span> · {v.vesselType}</span> : null}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {vesselCall.cargoNameSnapshot ? (
              <Badge variant="secondary" className="gap-1">
                <Package className="size-3" />
                {vesselCall.cargoNameSnapshot}
              </Badge>
            ) : null}
            {loc ? (
              <Badge variant="outline" className="gap-1">
                <MapPin className="size-3" />
                {loc.name}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <CardContent className="space-y-4 pt-4">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={Package}
            label="Approx total"
            value={
              <>
                {formatNum(vesselCall.approxTotalWeightTon)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">MT</span>
              </>
            }
            hint={tolerance ?? undefined}
          />
          <Stat
            icon={Sigma}
            label="Discharged"
            value={
              <>
                {formatNum(vesselCall.totalDischargeMt)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">MT</span>
              </>
            }
            hint={
              dischargedPct != null ? (
                <div className="mt-1 space-y-1">
                  <ProgressBar pct={dischargedPct} />
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {dischargedPct.toFixed(1)}% of approx total
                  </p>
                </div>
              ) : (
                "Set approx total to track progress"
              )
            }
          />
          <Stat
            icon={Gauge}
            label="Outstanding"
            value={outstanding}
            hint={
              vesselCall.nextStageExpectedAt
                ? `Next stage ${hoursRelativeToNow(vesselCall.nextStageExpectedAt)}`
                : `${vesselCall.completedStages}/${vesselCall.totalStages} stages done`
            }
          />
          <Stat
            icon={Clock}
            label="Laytime zone"
            value={<span className="font-mono text-sm">{layTzIana}</span>}
            hint={
              <>
                {layTzGmt ?? "—"}
                {layTzIsDefault ? <span className="ml-1 text-muted-foreground">(default)</span> : null}
              </>
            }
          />
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <Stat
            icon={CalendarClock}
            label="ETA · ATA"
            value={
              <span className="space-x-1 text-sm">
                <span>{formatDt(vesselCall.eta)}</span>
                <span className="text-muted-foreground">·</span>
                <span>{formatDt(vesselCall.ata)}</span>
              </span>
            }
            hint={
              vesselCall.eta && !vesselCall.ata
                ? `${hoursRelativeToNow(vesselCall.eta)}`
                : undefined
            }
          />
          <Stat
            icon={Timer}
            label="ETD · ATD"
            value={
              <span className="space-x-1 text-sm">
                <span>{formatDt(vesselCall.etd)}</span>
                <span className="text-muted-foreground">·</span>
                <span>{formatDt(vesselCall.atd)}</span>
              </span>
            }
            hint={
              vesselCall.etd && !vesselCall.atd
                ? `${hoursRelativeToNow(vesselCall.etd)}`
                : undefined
            }
          />
          <Stat
            icon={Anchor}
            label="Berth status"
            value={
              <span className="space-x-1.5">
                <Badge
                  variant={vesselCall.isAnchored ? "default" : "outline"}
                  className="text-[10px]"
                >
                  {vesselCall.isAnchored ? "Anchored" : "Not anchored"}
                </Badge>
                <Badge
                  variant={vesselCall.isAlongside ? "default" : "outline"}
                  className="text-[10px]"
                >
                  {vesselCall.isAlongside ? "Alongside" : "Off-berth"}
                </Badge>
              </span>
            }
            hint={vesselCall.currentAnchorage ? `At ${vesselCall.currentAnchorage}` : undefined}
          />
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Globe2 className="size-3.5" /> Voyage timeline
          </p>
          <MilestoneStrip steps={milestones} />
        </div>

        {ic ? (
          <Link
            href={`/import-contracts/${ic.id}`}
            className="group flex items-center justify-between gap-3 rounded-md border border-primary/25 bg-primary/5 px-3 py-2.5 text-xs transition-colors hover:bg-primary/10"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  Contract {ic.contractNo}
                  {ic.dischargePort ? (
                    <span className="ml-1 text-muted-foreground">· {ic.dischargePort}</span>
                  ) : null}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  Excluded days: {(ic.excludedDays ?? []).join(", ") || "—"}
                  {ic.dischargeRateMtPerDay
                    ? ` · ${ic.dischargeRateMtPerDay} ${ic.dischargeRateUnit ?? "MT/day"}`
                    : ""}
                </p>
              </div>
            </div>
            <span className="shrink-0 text-[11px] font-medium text-primary group-hover:underline">
              Edit terms →
            </span>
          </Link>
        ) : null}

        <div className="rounded-md border border-border/70 bg-muted/20 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Ruler className="size-3.5" /> Vessel specifications
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
