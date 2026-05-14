"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Anchor,
  ArrowRight,
  Calculator,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Database,
  FileText,
  Layers,
  ListChecks,
  Navigation,
  Route,
  Ship,
  Waves
} from "lucide-react";
import Link from "next/link";

import { useUserProfile } from "@/components/providers/auth-provider";
import { SofStatusBadge } from "@/components/sof/sof-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDt } from "@/lib/format";
import { fetchLighterTrips } from "@/lib/lighter-trips-api";
import { fetchLighterSofs, fetchMotherSofs } from "@/lib/sof-api";
import { fetchVesselCalls } from "@/lib/vessel-calls-api";
import { cn } from "@/lib/utils";
import { canCreateVesselCalls } from "@/lib/vessel-call-permissions";
import type { LighterTripListRow, MotherSofListRow, VesselCallListRow } from "@/types/vms";

/** Mother call statuses that count as "active in port / operations" right now. */
const ACTIVE_MOTHER_CALL_STATUSES = new Set([
  "ARRIVED",
  "ANCHORED",
  "READY_TO_DISCHARGE",
  "DISCHARGING",
  "PARTIAL_DISCHARGED"
]);

/** Lighter-trip statuses that count as "currently in motion". */
const ACTIVE_LIGHTER_TRIP_STATUSES = new Set([
  "ASSIGNED",
  "READY_TO_SAIL",
  "OUTBOUND_AT_SEA",
  "AT_CHECKPOINT",
  "ALONGSIDE",
  "PREPARING_TO_LOAD",
  "LOADING",
  "LOADED",
  "RETURNING_AT_SEA",
  "ARRIVED_GHAT",
  "WAITING_UNLOAD",
  "UNLOADING",
  "PARTIAL_UNLOADED"
]);

/** SOF statuses that still need attention (not closed/approved). */
const OPEN_SOF_STATUSES = new Set([
  "DRAFT",
  "PENDING_VERIFICATION",
  "VERIFIED",
  "DISPUTED"
]);

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function MotherCallStatusBadge({ status }: { status: string }) {
  if (status === "COMPLETED" || status === "CLOSED") {
    return <Badge variant="success">{status}</Badge>;
  }
  if (status === "DISCHARGING" || status === "PARTIAL_DISCHARGED") {
    return <Badge variant="default">{status}</Badge>;
  }
  if (status === "LC_HOLD" || status === "CANCELLED") {
    return <Badge variant="warning">{status}</Badge>;
  }
  if (status === "EXPECTED") {
    return <Badge variant="outline">{status}</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

function LighterTripStatusBadge({ status }: { status: string }) {
  if (status === "UNLOADED" || status === "CLOSED") {
    return <Badge variant="success">{status}</Badge>;
  }
  if (status === "ON_HOLD" || status === "CANCELLED" || status === "NOT_READY") {
    return <Badge variant="warning">{status}</Badge>;
  }
  if (
    status === "LOADING" ||
    status === "UNLOADING" ||
    status === "PARTIAL_UNLOADED"
  ) {
    return <Badge variant="default">{status}</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Anchor;
  iconClassName?: string;
  isLoading?: boolean;
};

function KpiCard({ label, value, hint, icon: Icon, iconClassName, isLoading }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
          iconClassName ?? "from-primary/60 to-primary"
        )}
      />
      <CardContent className="flex items-start gap-4 p-4 md:p-5">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-lg",
            "bg-muted text-foreground/80"
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <p className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{value}</p>
          )}
          {hint ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

type ShortcutTileProps = {
  href: string;
  label: string;
  description: string;
  icon: typeof Anchor;
};

function ShortcutTile({ href, label, description, icon: Icon }: ShortcutTileProps) {
  return (
    <Link
      href={href}
      className="group block rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium">{label}</p>
            <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </div>
    </Link>
  );
}

function MotherCallRow({ row }: { row: VesselCallListRow }) {
  const isMother = row.vessel.isMotherVessel;
  const detailHref = `/vessel-sof/overview?vesselCallId=${encodeURIComponent(row.id)}`;
  return (
    <Link
      href={detailHref}
      className="flex items-center justify-between gap-3 rounded-md border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/60"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md",
            isMother
              ? "bg-primary/10 text-primary"
              : "bg-accent text-accent-foreground"
          )}
        >
          {isMother ? <Ship className="size-4" /> : <Anchor className="size-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{row.vessel.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            <span className="font-mono">{row.callNo}</span>
            {row.cargoNameSnapshot ? <span> · {row.cargoNameSnapshot}</span> : null}
            {row.eta ? <span> · ETA {formatDt(row.eta)}</span> : null}
          </p>
        </div>
      </div>
      <MotherCallStatusBadge status={row.status} />
    </Link>
  );
}

function MotherSofRow({ row }: { row: MotherSofListRow }) {
  const vesselName = row.vesselCall?.vessel.name ?? "—";
  const cargo = row.vesselCall?.cargoNameSnapshot;
  return (
    <Link
      href={`/vessel-sof/overview?motherSofId=${encodeURIComponent(row.id)}`}
      className="flex items-center justify-between gap-3 rounded-md border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/60"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <FileText className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{vesselName}</p>
          <p className="truncate text-xs text-muted-foreground">
            <span className="font-mono">{row.sofNo}</span>
            {cargo ? <span> · {cargo}</span> : null}
            {row.startedAt ? <span> · {formatDt(row.startedAt)}</span> : null}
          </p>
        </div>
      </div>
      <SofStatusBadge status={row.status} />
    </Link>
  );
}

function LighterTripRow({ row }: { row: LighterTripListRow }) {
  return (
    <Link
      href={`/trips?tripId=${encodeURIComponent(row.id)}`}
      className="flex items-center justify-between gap-3 rounded-md border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/60"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <Waves className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{row.lighterVessel.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            <span className="font-mono">{row.tripNo}</span>
            <span> · MV {row.vesselCall.vessel.name}</span>
          </p>
        </div>
      </div>
      <LighterTripStatusBadge status={row.status} />
    </Link>
  );
}

function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="size-9 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border px-4 py-8 text-center">
      <CheckCircle2 className="size-5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function HomeDashboard() {
  const profile = useUserProfile();
  const canManage = canCreateVesselCalls(profile);

  const motherCallsQ = useQuery({
    queryKey: ["dashboard", "vessel-calls", "mother"],
    queryFn: () => fetchVesselCalls({ limit: 30, hullKind: "mother" }),
    staleTime: 30_000
  });

  const motherSofsQ = useQuery({
    queryKey: ["dashboard", "mother-sofs"],
    queryFn: () => fetchMotherSofs({ limit: 30 }),
    staleTime: 30_000
  });

  const lighterTripsQ = useQuery({
    queryKey: ["dashboard", "lighter-trips"],
    queryFn: () => fetchLighterTrips({ limit: 50 }),
    staleTime: 30_000
  });

  const lighterSofsQ = useQuery({
    queryKey: ["dashboard", "lighter-sofs"],
    queryFn: () => fetchLighterSofs({ limit: 30 }),
    staleTime: 30_000
  });

  const motherCalls = motherCallsQ.data?.data ?? [];
  const motherSofs = motherSofsQ.data?.data ?? [];
  const lighterTrips = lighterTripsQ.data?.data ?? [];
  const lighterSofs = lighterSofsQ.data?.data ?? [];

  const activeMotherCalls = motherCalls.filter((c) =>
    ACTIVE_MOTHER_CALL_STATUSES.has(c.status)
  );
  const expectedMotherCalls = motherCalls.filter((c) => c.status === "EXPECTED");

  const dischargingNow = motherCalls.filter(
    (c) => c.status === "DISCHARGING" || c.status === "PARTIAL_DISCHARGED"
  );

  const openSofs = [...motherSofs, ...lighterSofs].filter((s) =>
    OPEN_SOF_STATUSES.has(s.status)
  );

  const activeLighterTrips = lighterTrips.filter((t) =>
    ACTIVE_LIGHTER_TRIP_STATUSES.has(t.status)
  );

  const recentMotherCalls = [...motherCalls]
    .sort((a, b) => {
      const ax = a.ata ?? a.eta ?? "";
      const bx = b.ata ?? b.eta ?? "";
      return bx.localeCompare(ax);
    })
    .slice(0, 6);

  const recentMotherSofs = motherSofs.slice(0, 5);
  const activeLighterTripsTop = activeLighterTrips.slice(0, 6);

  const totalDischargingMt = dischargingNow.reduce((acc, c) => {
    const v = parseFloat(c.totalDischargeMt ?? "0");
    return acc + (Number.isFinite(v) ? v : 0);
  }, 0);

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Anchor className="size-3.5" />
              Vessel Management System
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              {greeting()}
              {profile?.fullName ? `, ${profile.fullName.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {todayStr} · Mother &amp; lighter operations, statement of facts, and laytime at a glance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManage ? (
              <Button asChild>
                <Link href="/vessel-calls">
                  <CalendarClock className="size-4" />
                  Manage vessel calls
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link href="/vessel-sof/overview">
                <ClipboardList className="size-4" />
                Open SOF workspace
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Active mother vessels"
          value={String(activeMotherCalls.length)}
          hint={
            dischargingNow.length > 0
              ? `${dischargingNow.length} discharging now`
              : "Anchored / arrived"
          }
          icon={Ship}
          iconClassName="from-primary/40 to-primary"
          isLoading={motherCallsQ.isLoading}
        />
        <KpiCard
          label="Expected arrivals"
          value={String(expectedMotherCalls.length)}
          hint={
            expectedMotherCalls[0]?.eta
              ? `Next ETA ${formatDt(expectedMotherCalls[0].eta)}`
              : "Upcoming mother calls"
          }
          icon={Navigation}
          iconClassName="from-emerald-500/40 to-emerald-500"
          isLoading={motherCallsQ.isLoading}
        />
        <KpiCard
          label="Active lighter trips"
          value={String(activeLighterTrips.length)}
          hint={
            activeLighterTrips.length > 0
              ? `${activeLighterTrips.filter((t) => t.status === "LOADING").length} loading · ${activeLighterTrips.filter((t) => t.status === "UNLOADING").length} unloading`
              : "Idle pipeline"
          }
          icon={Waves}
          iconClassName="from-sky-500/40 to-sky-500"
          isLoading={lighterTripsQ.isLoading}
        />
        <KpiCard
          label="Open SOFs"
          value={String(openSofs.length)}
          hint={
            totalDischargingMt > 0
              ? `${totalDischargingMt.toLocaleString()} MT discharged so far`
              : "Drafts & pending review"
          }
          icon={FileText}
          iconClassName="from-amber-500/40 to-amber-500"
          isLoading={motherSofsQ.isLoading || lighterSofsQ.isLoading}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <Ship className="size-4 text-primary" />
                Mother vessel calls
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Latest arrivals and expected calls in port
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/vessel-calls">
                View all
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {motherCallsQ.isLoading ? (
              <ListSkeleton rows={5} />
            ) : recentMotherCalls.length === 0 ? (
              <EmptyState label="No mother vessel calls yet. Create one to get started." />
            ) : (
              <div className="space-y-1">
                {recentMotherCalls.map((row) => (
                  <MotherCallRow key={row.id} row={row} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <Waves className="size-4 text-sky-600 dark:text-sky-400" />
                Lighter trips on the move
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Live pipeline · loading, sailing, unloading
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/trips">
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {lighterTripsQ.isLoading ? (
              <ListSkeleton rows={4} />
            ) : activeLighterTripsTop.length === 0 ? (
              <EmptyState label="No active lighter trips." />
            ) : (
              <div className="space-y-1">
                {activeLighterTripsTop.map((row) => (
                  <LighterTripRow key={row.id} row={row} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4 text-primary" />
                Recent statement of facts
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Drafts, pending verification, and approved SOFs
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/vessel-sof/overview">
                View all
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {motherSofsQ.isLoading ? (
              <ListSkeleton rows={5} />
            ) : recentMotherSofs.length === 0 ? (
              <EmptyState label="No SOFs created yet." />
            ) : (
              <div className="space-y-1">
                {recentMotherSofs.map((row) => (
                  <MotherSofRow key={row.id} row={row} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-emerald-600 dark:text-emerald-400" />
              Operations snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SnapshotRow
              icon={Ship}
              label="In port (mother)"
              value={activeMotherCalls.length}
              isLoading={motherCallsQ.isLoading}
            />
            <SnapshotRow
              icon={Clock3}
              label="Discharging"
              value={dischargingNow.length}
              isLoading={motherCallsQ.isLoading}
            />
            <SnapshotRow
              icon={Waves}
              label="Lighter trips active"
              value={activeLighterTrips.length}
              isLoading={lighterTripsQ.isLoading}
            />
            <SnapshotRow
              icon={ListChecks}
              label="SOFs awaiting review"
              value={openSofs.filter((s) => s.status === "PENDING_VERIFICATION").length}
              isLoading={motherSofsQ.isLoading}
            />
            <SnapshotRow
              icon={CheckCircle2}
              label="Approved this view"
              value={
                [...motherSofs, ...lighterSofs].filter(
                  (s) => s.status === "APPROVED" || s.status === "CLOSED"
                ).length
              }
              isLoading={motherSofsQ.isLoading}
            />
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Quick access</h2>
            <p className="text-xs text-muted-foreground">Jump straight into a workspace</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <ShortcutTile
            href="/vessel-sof/overview"
            label="SOF overview"
            description="Mother &amp; lighter statements of facts, timesheets, and discharge"
            icon={Layers}
          />
          <ShortcutTile
            href="/vessel-sof/events"
            label="SOF events"
            description="Record arrivals, holds, hose connections, departures"
            icon={ListChecks}
          />
          <ShortcutTile
            href="/vessel-sof/laytime"
            label="Laytime calculation"
            description="Allowed vs. used time, demurrage / dispatch"
            icon={Calculator}
          />
          <ShortcutTile
            href="/vessel-calls"
            label="Vessel calls"
            description="Plan mother and lighter port calls and ETAs"
            icon={CalendarClock}
          />
          <ShortcutTile
            href="/trips"
            label="Lighter trips"
            description="Assign carriers and track lighters end-to-end"
            icon={Route}
          />
          <ShortcutTile
            href="/reports"
            label="Reports"
            description="Discharge, ghat aging, and operational summaries"
            icon={ClipboardList}
          />
          <ShortcutTile
            href="/mother-vessel-reports"
            label="Mother vessel reports"
            description="Per-vessel discharge and operational reports"
            icon={FileText}
          />
          <ShortcutTile
            href="/master-data"
            label="Master data"
            description="Vessels, ghats, products, locations, organizations"
            icon={Database}
          />
        </div>
      </section>
    </div>
  );
}

type SnapshotRowProps = {
  icon: typeof Anchor;
  label: string;
  value: number;
  isLoading?: boolean;
};

function SnapshotRow({ icon: Icon, label, value, isLoading }: SnapshotRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm">{label}</span>
      </div>
      {isLoading ? (
        <Skeleton className="h-5 w-8" />
      ) : (
        <span className="text-sm font-semibold tabular-nums">{value}</span>
      )}
    </div>
  );
}
