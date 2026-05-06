"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type { MotherVesselCallDetail } from "@/components/sof/mother-vessel-panels";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDt } from "@/lib/format";
import { fetchLighterTripBoardMetrics, fetchLighterTrips } from "@/lib/lighter-trips-api";
import { DEFAULT_LAYTIME_IANA_ZONE } from "@/lib/timezone-gmt";
import type { LighterTripGhatAgingRow, Paginated, VesselCallBoardMetrics } from "@/types/vms";

function parseMt(v: string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function fmtMt(n: number | null, digits = 3): string {
  if (n == null) return "—";
  return n.toFixed(digits);
}

function fmtInt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return String(n);
}

function daysSince(iso: string | null | undefined, end = new Date()): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((end.getTime() - t) / 86_400_000));
}

function lighterDurationDays(row: LighterTripGhatAgingRow): string {
  const start =
    row.arrivedGhatDate ?? row.wayToGhatStartedAt ?? row.departedMvDate ?? row.assignedAt;
  const end = row.unloadCompletedAt ?? new Date().toISOString();
  const d = daysSince(start, new Date(end));
  return d != null ? String(d) : "—";
}

function cargoLabel(row: LighterTripGhatAgingRow): string {
  if (!row.cargoes?.length) return "—";
  return row.cargoes.map((c) => c.product.name).join(", ");
}

function unloadQty(row: LighterTripGhatAgingRow): number | null {
  const a = row.lighterAssignment?.actualDischargedQtyMt;
  const fromAssign = parseMt(a ?? undefined);
  if (fromAssign != null) return fromAssign;
  let s = 0;
  let any = false;
  for (const c of row.cargoes ?? []) {
    const q = parseMt(c.dischargedQtyTon ?? undefined);
    if (q != null) {
      s += q;
      any = true;
    }
  }
  return any ? s : null;
}

function balanceQty(row: LighterTripGhatAgingRow): number | null {
  const est = parseMt(row.lighterAssignment?.estimatedQtyMt);
  const u = unloadQty(row);
  if (est == null) return null;
  if (u == null) return est;
  return Math.max(0, est - u);
}

export type MotherVesselDischargeRow = {
  id: string;
  reportDate: string;
  quantity24hMt: string;
  cumulativeMt: string | null;
  remainingMt: string | null;
};

type MotherVesselReportsPanelProps = {
  vesselCall: MotherVesselCallDetail | null;
  vesselCallId: string | undefined;
  discharges: MotherVesselDischargeRow[];
};

export function MotherVesselReportsPanel({
  vesselCall,
  vesselCallId,
  discharges
}: MotherVesselReportsPanelProps) {
  const boardQ = useQuery({
    queryKey: ["lighter-board-metrics", vesselCallId],
    queryFn: () => fetchLighterTripBoardMetrics([vesselCallId!]),
    enabled: !!vesselCallId
  });

  const m: VesselCallBoardMetrics | undefined = vesselCallId
    ? boardQ.data?.byVesselCallId[vesselCallId]
    : undefined;

  const tripsQ = useInfiniteQuery({
    queryKey: ["lighter-trips-ghat-aging", vesselCallId],
    enabled: !!vesselCallId,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchLighterTrips({
        vesselCallId,
        limit: 500,
        cursor: pageParam,
        report: "ghat-aging"
      }) as Promise<Paginated<LighterTripGhatAgingRow>>,
    getNextPageParam: (last) => last.nextCursor ?? undefined
  });

  const trips = useMemo((): LighterTripGhatAgingRow[] => {
    return tripsQ.data?.pages.flatMap((p) => p.data) ?? [];
  }, [tripsQ.data]);

  const sortedDischarges = useMemo((): MotherVesselDischargeRow[] => {
    return [...discharges].sort(
      (a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
    );
  }, [discharges]);

  const last5AvgMother = useMemo(() => {
    const slice = sortedDischarges.slice(0, 5);
    if (!slice.length) return null;
    let sum = 0;
    for (const r of slice) {
      const q = parseMt(r.quantity24hMt);
      if (q != null) sum += q;
    }
    return sum / slice.length;
  }, [sortedDischarges]);

  const dischargeGrid = useMemo((): MotherVesselDischargeRow[] => {
    return [...discharges].sort(
      (a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()
    );
  }, [discharges]);

  const approx = parseMt(vesselCall?.approxTotalWeightTon);
  const discharged = parseMt(vesselCall?.totalDischargeMt);
  const balanceMv = approx != null && discharged != null ? Math.max(0, approx - discharged) : null;
  const latestRemaining = parseMt(sortedDischarges[0]?.remainingMt ?? undefined);
  const balanceOnBoard = latestRemaining ?? balanceMv;
  const availableForDischarge = latestRemaining ?? balanceMv;

  const ghatGroups = useMemo((): [string, LighterTripGhatAgingRow[]][] => {
    const map = new Map<string, LighterTripGhatAgingRow[]>();
    for (const t of trips) {
      const area =
        t.lighterAssignment?.destinationGhat?.location?.name?.trim() ||
        vesselCall?.arrivalLocation?.name ||
        "—";
      const list = map.get(area) ?? [];
      list.push(t);
      map.set(area, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [trips, vesselCall?.arrivalLocation?.name]);

  if (!vesselCallId || !vesselCall) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          Link a vessel call to this SOF to generate mother-vessel discharge and lighter reports.
        </CardContent>
      </Card>
    );
  }

  const p = m?.pipeline;
  const boardLoading = boardQ.isLoading;

  return (
    <Tabs defaultValue="discharge-update" className="w-full">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-1">
        <TabsTrigger value="discharge-update" className="text-xs sm:text-sm">
          Discharge update
        </TabsTrigger>
        <TabsTrigger value="cumulative" className="text-xs sm:text-sm">
          Cumulative discharge
        </TabsTrigger>
        <TabsTrigger value="ghat-aging" className="text-xs sm:text-sm">
          Lighter aging at ghat
        </TabsTrigger>
      </TabsList>

      <TabsContent value="discharge-update" className="space-y-3 pt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">All mother vessel discharge update</CardTitle>
            <CardDescription className="text-xs">
              Twenty-three column operational sheet. Last night allocated uses the vessel
              call&apos;s laytime IANA zone (same as laytime calendar; GMT offset shown on the SOF
              laytime tab); if empty,{" "}
              <span className="font-medium">{DEFAULT_LAYTIME_IANA_ZONE}</span> applies. It counts
              allocations whose assignment date or trip assigned-at falls in the previous calendar
              day in that zone.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {boardLoading ? (
              <Skeleton className="h-24 w-full min-w-[60rem]" />
            ) : boardQ.isError ? (
              <p className="text-sm text-destructive">
                Could not load discharge metrics for this call.
              </p>
            ) : (
              <table className="w-max min-w-full border-collapse text-left text-[11px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Mother vessel</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Consignee</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Arr. date</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Days</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Cargo</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Total arr. (MT)</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Avail. discharge</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Last night alloc.</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Total alloc.</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Total released</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Engaged</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">To MV</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Alongside</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Loading</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Load done</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Voyage ghat</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Ghat wait</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Ghat unload</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Trips</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Balance MV</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Disch. MV</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Rem voyage</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Rem LV ghat</th>
                    <th className="whitespace-nowrap px-1.5 py-2 font-medium">Disch. LV</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-1.5 py-2 font-medium">{vesselCall.vessel.name}</td>
                    <td className="px-1.5 py-2">{vesselCall.cnf?.name ?? "—"}</td>
                    <td className="px-1.5 py-2">{formatDt(vesselCall.ata)}</td>
                    <td className="px-1.5 py-2">{daysSince(vesselCall.ata) ?? "—"}</td>
                    <td
                      className="max-w-[9rem] truncate px-1.5 py-2"
                      title={vesselCall.cargoNameSnapshot ?? ""}
                    >
                      {vesselCall.cargoNameSnapshot ?? "—"}
                    </td>
                    <td className="px-1.5 py-2 font-mono">{fmtMt(approx, 3)}</td>
                    <td className="px-1.5 py-2 font-mono">{fmtMt(availableForDischarge, 3)}</td>
                    <td className="px-1.5 py-2">{fmtInt(m?.lastNightAllocated)}</td>
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
                    <td className="px-1.5 py-2 font-mono">{fmtMt(balanceOnBoard, 3)}</td>
                    <td className="px-1.5 py-2 font-mono">{fmtMt(discharged, 3)}</td>
                    <td className="px-1.5 py-2 font-mono">{fmtMt(m?.remVoyageMt ?? null, 3)}</td>
                    <td className="px-1.5 py-2 font-mono">{fmtMt(m?.remGhatMt ?? null, 3)}</td>
                    <td className="px-1.5 py-2 font-mono">
                      {fmtMt(m?.dischargedFromLvMt ?? null, 3)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
            <p className="mt-3 text-[11px] text-muted-foreground">
              Total alloc. = lighter assignments on this call. Pipeline columns count each active
              trip once. Edit daily discharge under <span className="font-medium">Discharge</span>{" "}
              (main menu or this SOF).
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cumulative" className="space-y-3 pt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cumulative discharge from mother vessel</CardTitle>
            <CardDescription className="text-xs">
              Mother: daily rows on this SOF. Lighter: sum of unload MT on trips whose{" "}
              <span className="font-medium">unload completed</span> time falls in the last five
              calendar days in the call&apos;s laytime zone (including today), divided by five
              (MT/day). Default zone when unset matches laytime (
              <span className="font-medium">{DEFAULT_LAYTIME_IANA_ZONE}</span>).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">
                  Last 5 report days avg (mother, MT/day):
                </span>{" "}
                <span className="font-medium">
                  {last5AvgMother != null ? last5AvgMother.toFixed(3) : "—"}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">
                  Last 5 port-calendar days avg (lighter unload, MT/day):
                </span>{" "}
                <span className="font-medium">
                  {m?.lighterDischargeLast5DayAvgMt != null
                    ? m.lighterDischargeLast5DayAvgMt.toFixed(3)
                    : "—"}
                </span>
              </p>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2 font-medium">Report date</th>
                    <th className="px-3 py-2 font-medium">24h MT</th>
                    <th className="px-3 py-2 font-medium">Cumulative MT</th>
                    <th className="px-3 py-2 font-medium">Remaining MT</th>
                  </tr>
                </thead>
                <tbody>
                  {dischargeGrid.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                        No daily discharge rows yet.
                      </td>
                    </tr>
                  ) : (
                    dischargeGrid.map((r) => (
                      <tr key={r.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">{formatDt(r.reportDate)}</td>
                        <td className="px-3 py-2 font-mono">{r.quantity24hMt}</td>
                        <td className="px-3 py-2 font-mono">{r.cumulativeMt ?? "—"}</td>
                        <td className="px-3 py-2 font-mono">{r.remainingMt ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="ghat-aging" className="space-y-3 pt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Lighter aging report at ghat</CardTitle>
            <CardDescription className="text-xs">
              Trips for this mother call, grouped by ghat area (location). Quantities from
              assignment and cargo lines.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tripsQ.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : tripsQ.isError ? (
              <p className="text-sm text-destructive">
                Could not load lighter trips for this report.
              </p>
            ) : trips.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No lighter trips for this vessel call.
              </p>
            ) : (
              ghatGroups.map(([area, groupRows]) => {
                let subUnload = 0;
                let subBal = 0;
                for (const row of groupRows) {
                  const u = unloadQty(row);
                  const b = balanceQty(row);
                  if (u != null) subUnload += u;
                  if (b != null) subBal += b;
                }
                return (
                  <div key={area} className="space-y-2">
                    <p className="text-sm font-medium">{area}</p>
                    <div className="overflow-x-auto rounded-md border border-border">
                      <table className="w-max min-w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="px-2 py-2 font-medium">Area</th>
                            <th className="px-2 py-2 font-medium">Mother vessel</th>
                            <th className="px-2 py-2 font-medium">Item</th>
                            <th className="px-2 py-2 font-medium">Days</th>
                            <th className="px-2 py-2 font-medium">Lighter</th>
                            <th className="px-2 py-2 font-medium">Ghat</th>
                            <th className="px-2 py-2 font-medium">Party</th>
                            <th className="px-2 py-2 font-medium">Unload MT</th>
                            <th className="px-2 py-2 font-medium">Balance MT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupRows.map((row) => (
                            <tr key={row.id} className="border-b border-border">
                              <td className="px-2 py-2">{area}</td>
                              <td className="px-2 py-2">{row.vesselCall.vessel.name}</td>
                              <td
                                className="max-w-[8rem] truncate px-2 py-2"
                                title={cargoLabel(row)}
                              >
                                {cargoLabel(row)}
                              </td>
                              <td className="px-2 py-2">{lighterDurationDays(row)}</td>
                              <td className="px-2 py-2">{row.lighterVessel.name}</td>
                              <td className="px-2 py-2">
                                {row.lighterAssignment?.destinationGhat?.name ?? "—"}
                              </td>
                              <td className="max-w-[7rem] truncate px-2 py-2">
                                {row.lighterAssignment?.carrier?.organization?.name ?? "—"}
                              </td>
                              <td className="px-2 py-2 font-mono">{fmtMt(unloadQty(row), 3)}</td>
                              <td className="px-2 py-2 font-mono">{fmtMt(balanceQty(row), 3)}</td>
                            </tr>
                          ))}
                          <tr className="bg-muted/40 font-medium">
                            <td colSpan={7} className="px-2 py-2">
                              {area} total
                            </td>
                            <td className="px-2 py-2 font-mono">{subUnload.toFixed(3)}</td>
                            <td className="px-2 py-2 font-mono">{subBal.toFixed(3)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
            {tripsQ.hasNextPage ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={tripsQ.isFetchingNextPage}
                onClick={() => tripsQ.fetchNextPage()}
              >
                {tripsQ.isFetchingNextPage ? "Loading…" : "Load more trips"}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
