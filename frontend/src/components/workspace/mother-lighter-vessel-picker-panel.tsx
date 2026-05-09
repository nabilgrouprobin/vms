"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  MotherLighterPickerCard,
  MotherLighterPickerToolbar,
  PickerCardGrid,
  PickerCardSkeletonGrid,
  PickerEmptyState,
  PickerErrorState,
  PickerScrollArea,
  SelectablePickerCard
} from "@/components/workspace/mother-lighter-picker";
import { fetchLighterVesselsForPicker } from "@/lib/lighter-trips-api";
import { parseApiErr } from "@/lib/parse-api-error";
import { fetchLighterSofs, fetchMotherSofs } from "@/lib/sof-api";
import { fetchVesselCalls } from "@/lib/vessel-calls-api";
import type { LighterVesselPickerRow, Paginated, VesselCallListRow } from "@/types/vms";

/** Invalidate all mother/lighter hull vessel pickers (Trips, Vessel SOF, assign sheets). */
export const ML_VESSEL_PICKER_QUERY_ROOT = ["ml-vessel-picker"] as const;

const qkMother = (debouncedSearch: string) =>
  [...ML_VESSEL_PICKER_QUERY_ROOT, "mother", debouncedSearch] as const;
const qkLighter = (debouncedSearch: string) =>
  [...ML_VESSEL_PICKER_QUERY_ROOT, "lighter", debouncedSearch] as const;

export function motherVesselCallPickerTitle(row: VesselCallListRow): string {
  return row.vessel.name;
}

export function motherVesselCallPickerDetails(row: VesselCallListRow): string {
  const cargo = row.cargoNameSnapshot ? ` · ${row.cargoNameSnapshot}` : "";
  return `${row.callNo} · ${row.status}${cargo} · ${row._count.lighterTrips} trips · ${row._count.lighterAssignments} allocations`;
}

export function lighterHullPickerTitle(row: LighterVesselPickerRow): string {
  return row.name;
}

export function lighterHullPickerDetails(row: LighterVesselPickerRow): string {
  const imo = row.imoNo ? `IMO ${row.imoNo}` : "No IMO";
  const t = row.activeTrip;
  if (t) {
    return `${imo} · On trip ${t.tripNo} · ${t.vesselCall.vessel.name} (${t.vesselCall.callNo})`;
  }
  return `${imo} · Available for assignment`;
}

export type MotherLighterVesselPickerPanelProps = {
  kind: "mother" | "lighter";
  vesselCallId: string;
  lighterVesselId: string;
  search: string;
  debouncedSearch: string;
  onSearchChange: (v: string) => void;
  onKindChange: (next: "mother" | "lighter") => void;
  onSelectMother: (row: VesselCallListRow) => void;
  onSelectLighter: (row: LighterVesselPickerRow) => void;
  /** When false, vessel list queries stay idle (e.g. another step is active). */
  queriesEnabled: boolean;
  placeholderMother?: string;
  placeholderLighter?: string;
  trailing?: ReactNode;
};

/**
 * One implementation of Mother vs Lighter + mother **calls** / lighter **hulls** tiles.
 * Used by Trips and Vessel SOF workspace (Overview / Events / Laytime / Reports discharge) so menus stay consistent.
 */
export function MotherLighterVesselPickerPanel({
  kind,
  vesselCallId,
  lighterVesselId,
  search,
  debouncedSearch,
  onSearchChange,
  onKindChange,
  onSelectMother,
  onSelectLighter,
  queriesEnabled,
  placeholderMother = "Search call no., vessel, cargo…",
  placeholderLighter = "Search lighter name, IMO…",
  trailing
}: MotherLighterVesselPickerPanelProps) {
  const motherQ = useInfiniteQuery({
    queryKey: qkMother(debouncedSearch),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchVesselCalls({
        limit: 20,
        cursor: pageParam,
        search: debouncedSearch || undefined
      }),
    getNextPageParam: (last: Paginated<VesselCallListRow>) => last.nextCursor ?? undefined,
    enabled: queriesEnabled && kind === "mother"
  });

  const lighterQ = useQuery({
    queryKey: qkLighter(debouncedSearch),
    queryFn: () => fetchLighterVesselsForPicker(debouncedSearch || undefined, 60),
    enabled: queriesEnabled && kind === "lighter"
  });

  const motherRows = useMemo(
    () => motherQ.data?.pages.flatMap((p) => p.data) ?? [],
    [motherQ.data]
  );
  const lighterRows = lighterQ.data ?? [];
  const motherSofsQ = useQuery({
    queryKey: ["mother-sof", "availability-events"],
    queryFn: () => fetchMotherSofs({ limit: 200 }),
    staleTime: 60_000,
    enabled: queriesEnabled
  });
  const lighterSofsQ = useQuery({
    queryKey: ["lighter-sof", "availability-events"],
    queryFn: () => fetchLighterSofs({ limit: 200 }),
    staleTime: 60_000,
    enabled: queriesEnabled
  });

  const motherInUseByCallId = useMemo(() => {
    const out = new Map<string, boolean>();
    for (const row of motherSofsQ.data?.data ?? []) {
      const callId = row.vesselCall?.id;
      if (!callId) continue;
      const hasEvents = (row._count?.events ?? 0) > 0;
      if (hasEvents) out.set(callId, true);
      else if (!out.has(callId)) out.set(callId, false);
    }
    return out;
  }, [motherSofsQ.data]);

  const lighterInUseByVesselId = useMemo(() => {
    const out = new Map<string, boolean>();
    for (const row of lighterSofsQ.data?.data ?? []) {
      const vesselId = row.lighterTrip?.lighterVessel.id;
      if (!vesselId) continue;
      const hasEvents = (row._count?.events ?? 0) > 0;
      if (hasEvents) out.set(vesselId, true);
      else if (!out.has(vesselId)) out.set(vesselId, false);
    }
    return out;
  }, [lighterSofsQ.data]);

  const loadMoreMotherFooter =
    kind === "mother" && motherQ.hasNextPage ? (
      <Button
        variant="secondary"
        size="sm"
        className="w-full sm:w-auto"
        disabled={motherQ.isFetchingNextPage}
        onClick={() => void motherQ.fetchNextPage()}
      >
        {motherQ.isFetchingNextPage ? "Loading…" : "Load more"}
      </Button>
    ) : null;

  const loading = kind === "mother" ? motherQ.isLoading : lighterQ.isLoading;
  const failed = kind === "mother" ? motherQ.isError : lighterQ.isError;
  const errMsg = kind === "mother" ? parseApiErr(motherQ.error) : parseApiErr(lighterQ.error);

  return (
    <MotherLighterPickerCard
      toolbar={
        <MotherLighterPickerToolbar
          kind={kind}
          onKindChange={onKindChange}
          search={search}
          onSearchChange={onSearchChange}
          placeholderMother={placeholderMother}
          placeholderLighter={placeholderLighter}
          trailing={trailing}
        />
      }
      footer={loadMoreMotherFooter}
    >
      <PickerScrollArea>
        {loading ? (
          <PickerCardSkeletonGrid />
        ) : failed ? (
          <PickerErrorState message={errMsg} />
        ) : kind === "mother" ? (
          motherRows.length === 0 ? (
            <PickerEmptyState message="No mother vessel calls." />
          ) : (
            <PickerCardGrid>
              {motherRows.map((row) => {
                const inUse = motherInUseByCallId.get(row.id) ?? !!row.statementOfFacts;
                return (
                  <SelectablePickerCard
                    key={row.id}
                    title={motherVesselCallPickerTitle(row)}
                    details={motherVesselCallPickerDetails(row)}
                    availability={inUse ? "used" : "free"}
                    selected={vesselCallId === row.id}
                    onClick={() => onSelectMother(row)}
                  />
                );
              })}
            </PickerCardGrid>
          )
        ) : lighterRows.length === 0 ? (
          <PickerEmptyState message="No lighter hulls match." />
        ) : (
          <PickerCardGrid>
            {lighterRows.map((row: LighterVesselPickerRow) => {
              const inUse = lighterInUseByVesselId.get(row.id) ?? !!row.activeTrip;
              return (
                <SelectablePickerCard
                  key={row.id}
                  title={lighterHullPickerTitle(row)}
                  details={lighterHullPickerDetails(row)}
                  availability={inUse ? "used" : "free"}
                  selected={lighterVesselId === row.id}
                  onClick={() => onSelectLighter(row)}
                />
              );
            })}
          </PickerCardGrid>
        )}
      </PickerScrollArea>
    </MotherLighterPickerCard>
  );
}
