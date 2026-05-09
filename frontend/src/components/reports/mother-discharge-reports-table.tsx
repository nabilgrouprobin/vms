"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo } from "react";

import { SofStatusBadge } from "@/components/sof/sof-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDt } from "@/lib/format";
import { DEFAULT_LAYTIME_IANA_ZONE } from "@/lib/timezone-gmt";
import { fetchLighterTripBoardMetrics } from "@/lib/lighter-trips-api";
import { fmtInt, fmtMt, metricsFor, parseMt } from "@/lib/reports-discharge-table-utils";
import { fetchMotherSofs } from "@/lib/sof-api";
import { vesselSofWorkspacePath } from "@/lib/workspace-paths";
import type { MotherSofListRow, Paginated } from "@/types/vms";

export function MotherDischargeReportsTable({
  search,
  embedded = false
}: {
  search: string;
  /** When true, omit outer Card — use inside `MotherLighterPickerCard` + `PickerScrollArea variant="panel"`. */
  embedded?: boolean;
}) {
  const query = useInfiniteQuery({
    queryKey: ["mother-sof", "reports", search],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchMotherSofs({
        limit: 25,
        cursor: pageParam,
        search: search || undefined
      }),
    getNextPageParam: (last: Paginated<MotherSofListRow>) => last.nextCursor ?? undefined
  });

  const rows = useMemo((): MotherSofListRow[] => {
    return query.data?.pages.flatMap((p) => p.data) ?? [];
  }, [query.data]);

  const callIds = useMemo(() => {
    return [...new Set(rows.map((r) => r.vesselCall?.id).filter(Boolean))] as string[];
  }, [rows]);

  const boardQ = useQuery({
    queryKey: ["mother-vessel-board-metrics", callIds.join("|")],
    queryFn: () => fetchLighterTripBoardMetrics(callIds),
    enabled: callIds.length > 0
  });

  const byId = useMemo(() => {
    return boardQ.data?.byVesselCallId ?? {};
  }, [boardQ.data]);

  const totals = useMemo(() => {
    let approx = 0;
    let discharged = 0;
    let lastNight = 0;
    let assigns = 0;
    let released = 0;
    let engaged = 0;
    let trips = 0;
    const pl = {
      toMv: 0,
      alongside: 0,
      loading: 0,
      loadDone: 0,
      voyageGhat: 0,
      ghatStanding: 0,
      ghatDischarging: 0
    };
    let remVoyage = 0;
    let remGhat = 0;
    let lvDisch = 0;
    let l5sum = 0;
    let l5n = 0;

    for (const r of rows) {
      const vc = r.vesselCall;
      if (!vc?.id) continue;
      approx += parseMt(vc.approxTotalWeightTon);
      discharged += parseMt(vc.totalDischargeMt);
      const m = byId[vc.id];
      if (m) {
        lastNight += m.lastNightAllocated;
        assigns += m.totalAssignments;
        released += m.released;
        engaged += m.engaged;
        trips += m.totalTrips;
        pl.toMv += m.pipeline.toMv;
        pl.alongside += m.pipeline.alongside;
        pl.loading += m.pipeline.loading;
        pl.loadDone += m.pipeline.loadDone;
        pl.voyageGhat += m.pipeline.voyageGhat;
        pl.ghatStanding += m.pipeline.ghatStanding;
        pl.ghatDischarging += m.pipeline.ghatDischarging;
        if (m.remVoyageMt != null) remVoyage += m.remVoyageMt;
        if (m.remGhatMt != null) remGhat += m.remGhatMt;
        if (m.dischargedFromLvMt != null) lvDisch += m.dischargedFromLvMt;
        if (m.lighterDischargeLast5DayAvgMt != null) {
          l5sum += m.lighterDischargeLast5DayAvgMt;
          l5n += 1;
        }
      }
    }

    return {
      approx,
      discharged,
      balance: Math.max(0, approx - discharged),
      lastNight,
      assigns,
      released,
      engaged,
      trips,
      pl,
      remVoyage,
      remGhat,
      lvDisch,
      lighter5dAvg: l5n ? l5sum / l5n : null
    };
  }, [rows, byId]);

  const loadMore = query.hasNextPage ? (
    <Button
      variant="secondary"
      size="sm"
      className="w-full sm:w-auto"
      disabled={query.isFetchingNextPage}
      onClick={() => void query.fetchNextPage()}
    >
      {query.isFetchingNextPage ? "Loading…" : "Load more"}
    </Button>
  ) : null;

  const tableBody = query.isLoading ? (
    <Skeleton className="h-48 w-full" />
  ) : query.isError ? (
    <p className="py-2 text-sm text-destructive">Could not load mother vessel SOF list.</p>
  ) : rows.length === 0 ? (
    <p className="py-6 text-sm text-muted-foreground">No mother vessel SOF records.</p>
  ) : (
    <table className="w-max min-w-full border-collapse text-left text-[11px]">
      <thead>
        <tr className="border-b border-border bg-muted/50">
          <th className="sticky left-0 z-10 whitespace-nowrap bg-muted/50 px-1.5 py-2 font-medium">
            SOF
          </th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Mother vessel</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Call</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Consignee</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Arr.</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Days</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Cargo</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Total arr.</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Avail.</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Last night</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Alloc.</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Released</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Engaged</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">To MV</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Along</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Load</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Done</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Voy.</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Wait</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Unload</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Trips</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Bal.MV</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Dis.MV</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Rem voy</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Rem ghat</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">Dis.LV</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium">SOF st.</th>
          <th className="whitespace-nowrap px-1.5 py-2 font-medium"> </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const vc = r.vesselCall;
          const approx = vc ? parseMt(vc.approxTotalWeightTon) : 0;
          const disch = vc ? parseMt(vc.totalDischargeMt) : 0;
          const bal = Math.max(0, approx - disch);
          const m = vc ? metricsFor(byId, vc.id) : undefined;
          const p = m?.pipeline;
          const days = vc?.ata
            ? Math.max(0, Math.floor((Date.now() - new Date(vc.ata).getTime()) / 86_400_000))
            : null;

          return (
            <tr key={r.id} className="border-b border-border">
              <td className="sticky left-0 z-10 bg-card px-1.5 py-2 font-medium">{r.sofNo}</td>
              <td className="px-1.5 py-2">{vc?.vessel.name ?? "—"}</td>
              <td className="px-1.5 py-2">{vc?.callNo ?? "—"}</td>
              <td className="max-w-[6rem] truncate px-1.5 py-2">{vc?.cnf?.name ?? "—"}</td>
              <td className="whitespace-nowrap px-1.5 py-2">{vc?.ata ? formatDt(vc.ata) : "—"}</td>
              <td className="px-1.5 py-2">{days ?? "—"}</td>
              <td className="max-w-[7rem] truncate px-1.5 py-2" title={vc?.cargoNameSnapshot ?? ""}>
                {vc?.cargoNameSnapshot ?? "—"}
              </td>
              <td className="px-1.5 py-2 font-mono">{approx > 0 ? approx.toFixed(3) : "—"}</td>
              <td className="px-1.5 py-2 font-mono">
                {approx > 0 || disch > 0 ? bal.toFixed(3) : "—"}
              </td>
              <td className="px-1.5 py-2">
                {boardQ.isLoading ? "…" : fmtInt(m?.lastNightAllocated)}
              </td>
              <td className="px-1.5 py-2">{fmtInt(m?.totalAssignments)}</td>
              <td className="px-1.5 py-2">{fmtInt(m?.released)}</td>
              <td className="px-1.5 py-2">{fmtInt(m?.engaged)}</td>
              <td className="px-1.5 py-2">{fmtInt(p?.toMv)}</td>
              <td className="px-1.5 py-2">{fmtInt(p?.alongside)}</td>
              <td className="px-1.5 py-2">{fmtInt(p?.loading)}</td>
              <td className="px-1.5 py-2">{fmtInt(p?.loadDone)}</td>
              <td className="px-1.5 py-2">{fmtInt(p?.voyageGhat)}</td>
              <td className="px-1.5 py-2">{fmtInt(p?.ghatStanding)}</td>
              <td className="px-1.5 py-2">{fmtInt(p?.ghatDischarging)}</td>
              <td className="px-1.5 py-2">{fmtInt(m?.totalTrips)}</td>
              <td className="px-1.5 py-2 font-mono">
                {approx > 0 || disch > 0 ? bal.toFixed(3) : "—"}
              </td>
              <td className="px-1.5 py-2 font-mono">{disch > 0 ? disch.toFixed(3) : "—"}</td>
              <td className="px-1.5 py-2 font-mono">{fmtMt(m?.remVoyageMt ?? null)}</td>
              <td className="px-1.5 py-2 font-mono">{fmtMt(m?.remGhatMt ?? null)}</td>
              <td className="px-1.5 py-2 font-mono">{fmtMt(m?.dischargedFromLvMt ?? null)}</td>
              <td className="px-1.5 py-2">
                <SofStatusBadge status={r.status} />
              </td>
              <td className="px-1.5 py-2">
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <Link
                    href={vesselSofWorkspacePath("overview", "mother", {
                      id: r.id,
                      vesselCallId: r.vesselCall?.id ?? null
                    })}
                  >
                    Open
                  </Link>
                </Button>
              </td>
            </tr>
          );
        })}
        <tr className="bg-muted/50 font-medium">
          <td className="sticky left-0 z-10 bg-muted/50 px-1.5 py-2" colSpan={7}>
            Total ({rows.length} SOF)
          </td>
          <td className="px-1.5 py-2 font-mono">{totals.approx.toFixed(3)}</td>
          <td className="px-1.5 py-2 font-mono">{totals.balance.toFixed(3)}</td>
          <td className="px-1.5 py-2">{fmtInt(totals.lastNight)}</td>
          <td className="px-1.5 py-2">{fmtInt(totals.assigns)}</td>
          <td className="px-1.5 py-2">{fmtInt(totals.released)}</td>
          <td className="px-1.5 py-2">{fmtInt(totals.engaged)}</td>
          <td className="px-1.5 py-2">{fmtInt(totals.pl.toMv)}</td>
          <td className="px-1.5 py-2">{fmtInt(totals.pl.alongside)}</td>
          <td className="px-1.5 py-2">{fmtInt(totals.pl.loading)}</td>
          <td className="px-1.5 py-2">{fmtInt(totals.pl.loadDone)}</td>
          <td className="px-1.5 py-2">{fmtInt(totals.pl.voyageGhat)}</td>
          <td className="px-1.5 py-2">{fmtInt(totals.pl.ghatStanding)}</td>
          <td className="px-1.5 py-2">{fmtInt(totals.pl.ghatDischarging)}</td>
          <td className="px-1.5 py-2">{fmtInt(totals.trips)}</td>
          <td className="px-1.5 py-2 font-mono">{totals.balance.toFixed(3)}</td>
          <td className="px-1.5 py-2 font-mono">{totals.discharged.toFixed(3)}</td>
          <td className="px-1.5 py-2 font-mono">{fmtMt(totals.remVoyage)}</td>
          <td className="px-1.5 py-2 font-mono">{fmtMt(totals.remGhat)}</td>
          <td className="px-1.5 py-2 font-mono">{fmtMt(totals.lvDisch)}</td>
          <td colSpan={2} className="px-1.5 py-2 text-muted-foreground">
            Mean of per-call lighter 5d avg (port calendar days):{" "}
            {totals.lighter5dAvg != null ? totals.lighter5dAvg.toFixed(3) : "—"} MT/d
          </td>
        </tr>
      </tbody>
    </table>
  );

  if (embedded) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Mother vessel discharge update — fleet-wide table. Lighter metrics load in batch for
          visible rows. Last night allocated uses each call&apos;s laytime time zone (default{" "}
          {DEFAULT_LAYTIME_IANA_ZONE} when unset).
        </p>
        <div className="overflow-x-auto">{tableBody}</div>
        {loadMore}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Mother vessel discharge update</CardTitle>
          <CardDescription className="text-xs">
            Fleet-wide table (23 columns). Lighter metrics load in batch for visible rows. Last
            night allocated uses each call&apos;s laytime time zone (default{" "}
            {DEFAULT_LAYTIME_IANA_ZONE} when unset).
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0 sm:p-6 pt-0 sm:pt-0">{tableBody}</CardContent>
      </Card>
      {loadMore}
    </div>
  );
}
