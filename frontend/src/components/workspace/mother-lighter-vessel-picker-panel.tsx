"use client";

import type { QueryClient } from "@tanstack/react-query";
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
import { parseApiErr } from "@/lib/parse-api-error";
import { fetchLighterSofs, fetchMotherSofs } from "@/lib/sof-api";
import { fetchVesselCalls } from "@/lib/vessel-calls-api";
import type { LighterVesselPickerRow, Paginated, VesselCallListRow } from "@/types/vms";

/** Invalidate all mother/lighter vessel pickers (Trips, Vessel SOF, assign sheets). */
export const ML_VESSEL_PICKER_QUERY_ROOT = ["ml-vessel-picker"] as const;

/** Refetch inactive queries too so lists update after master-data or vessel-call changes. */
export async function invalidateMotherLighterPickerCaches(qc: QueryClient): Promise<void> {
  await Promise.all([
    qc.invalidateQueries({ queryKey: [...ML_VESSEL_PICKER_QUERY_ROOT], refetchType: "all" }),
    qc.invalidateQueries({ queryKey: ["create-vessel-call-hulls"], refetchType: "all" }),
    qc.invalidateQueries({ queryKey: ["lighter-hulls-picker"], refetchType: "all" }),
    qc.invalidateQueries({ queryKey: ["trips-mother-call-picker"], refetchType: "all" }),
    qc.invalidateQueries({ queryKey: ["vessel-calls-crud"], refetchType: "all" })
  ]);
}

const qkMother = (debouncedSearch: string) =>
  [...ML_VESSEL_PICKER_QUERY_ROOT, "mother", debouncedSearch] as const;

const qkLighterCalls = (debouncedSearch: string) =>
  [...ML_VESSEL_PICKER_QUERY_ROOT, "lighter-calls", debouncedSearch] as const;

export function motherVesselCallPickerTitle(row: VesselCallListRow): string {
  return row.vessel.name;
}

export function motherVesselCallPickerDetails(row: VesselCallListRow): string {
  const cargo = row.cargoNameSnapshot ? ` · ${row.cargoNameSnapshot}` : "";
  return `${row.callNo} · ${row.status}${cargo} · ${row._count.lighterTrips} trips · ${row._count.lighterAssignments} allocations`;
}

/**
 * Lighter **port call** row (`VesselCall` for a lighter hull).
 *
 * Title is the lighter hull name (matches the mother-tab pattern of showing
 * the vessel as the most identifiable label); the call number lives in the
 * details strip alongside status/cargo.
 */
export function lighterPortCallPickerTitle(row: VesselCallListRow): string {
  return row.vessel.name;
}

export function lighterPortCallPickerDetails(row: VesselCallListRow): string {
  const cargo = row.cargoNameSnapshot ? ` · ${row.cargoNameSnapshot}` : "";
  return `${row.callNo} · ${row.status}${cargo}`;
}

/** @deprecated Hull-based picker; prefer `lighterPortCallPickerTitle` with lighter port calls. */
export function lighterVesselPickerTitle(row: LighterVesselPickerRow): string {
  return row.name;
}

/** @deprecated Hull-based picker; prefer `lighterPortCallPickerDetails`. */
export function lighterVesselPickerDetails(row: LighterVesselPickerRow): string {
  const imo = row.imoNo ? `IMO ${row.imoNo}` : "No IMO";
  const inactive = row.isActive === false ? "Inactive · " : "";
  const t = row.activeTrip;
  if (t) {
    return `${inactive}${imo} · On trip ${t.tripNo} · ${t.vesselCall.vessel.name} (${t.vesselCall.callNo})`;
  }
  return `${inactive}${imo} · Available for assignment`;
}

/** @deprecated Use lighterVesselPickerTitle */
export const lighterHullPickerTitle = lighterVesselPickerTitle;
/** @deprecated Use lighterVesselPickerDetails */
export const lighterHullPickerDetails = lighterVesselPickerDetails;

export type MotherLighterVesselPickerPanelProps = {
  kind: "mother" | "lighter";
  vesselCallId: string;
  /** Selected lighter **port call** id (`VesselCall` where hull is a lighter). */
  lighterCallId: string;
  search: string;
  debouncedSearch: string;
  onSearchChange: (v: string) => void;
  onKindChange: (next: "mother" | "lighter") => void;
  onSelectMother: (row: VesselCallListRow) => void;
  onSelectLighter: (row: VesselCallListRow) => void;
  /** When false, vessel list queries stay idle (e.g. another step is active). */
  queriesEnabled: boolean;
  placeholderMother?: string;
  placeholderLighter?: string;
  /**
   * Ignored for the lighter tab (lighter list is port calls, not a hull registry).
   * Kept for API compatibility with older call sites.
   */
  lighterIncludeInactive?: boolean;
  trailing?: ReactNode;
};

/**
 * Mother vessel **calls** vs lighter **port calls** — same chrome as Trips / Vessel SOF workspaces.
 */
export function MotherLighterVesselPickerPanel({
  kind,
  vesselCallId,
  lighterCallId,
  search,
  debouncedSearch,
  onSearchChange,
  onKindChange,
  onSelectMother,
  onSelectLighter,
  queriesEnabled,
  placeholderMother = "Search call no., vessel, cargo…",
  placeholderLighter = "Search call no., lighter name, cargo…",
  lighterIncludeInactive: _lighterIncludeInactive = true,
  trailing
}: MotherLighterVesselPickerPanelProps) {
  void _lighterIncludeInactive;
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

  const lighterQ = useInfiniteQuery({
    queryKey: qkLighterCalls(debouncedSearch),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchVesselCalls({
        hullKind: "lighter",
        limit: 24,
        cursor: pageParam,
        search: debouncedSearch || undefined
      }),
    getNextPageParam: (last: Paginated<VesselCallListRow>) => last.nextCursor ?? undefined,
    enabled: queriesEnabled && kind === "lighter"
  });

  const motherRows = useMemo(
    () => motherQ.data?.pages.flatMap((p) => p.data) ?? [],
    [motherQ.data]
  );
  const lighterRows = useMemo(
    () => lighterQ.data?.pages.flatMap((p) => p.data) ?? [],
    [lighterQ.data]
  );

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

  /** Any lighter SOF with events on this hull → treat matching port calls as busy at hull level. */
  const lighterHullBusyFromSofs = useMemo(() => {
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

  const loadMoreLighterFooter =
    kind === "lighter" && lighterQ.hasNextPage ? (
      <Button
        variant="secondary"
        size="sm"
        className="w-full sm:w-auto"
        disabled={lighterQ.isFetchingNextPage}
        onClick={() => void lighterQ.fetchNextPage()}
      >
        {lighterQ.isFetchingNextPage ? "Loading…" : "Load more"}
      </Button>
    ) : null;

  const loadMoreFooter = kind === "mother" ? loadMoreMotherFooter : loadMoreLighterFooter;

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
      footer={loadMoreFooter}
    >
      <PickerScrollArea>
        {loading ? (
          <PickerCardSkeletonGrid />
        ) : failed ? (
          <PickerErrorState message={errMsg} />
        ) : kind === "mother" ? (
          motherRows.length === 0 ? (
            <PickerEmptyState message="No mother vessel calls match this search. The Mother tab lists port visits (calls), not hulls alone: register the hull under Master data, create the visit under Vessel calls, then pick it here." />
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
          <PickerEmptyState message="No lighter port calls match this search. Register lighter hulls under Master data → Lighters, then create a visit under Vessel calls → Lighter port calls." />
        ) : (
          <PickerCardGrid>
            {lighterRows.map((row) => {
              const hullBusy =
                lighterHullBusyFromSofs.get(row.vessel.id) ?? !!row.statementOfFacts;
              return (
                <SelectablePickerCard
                  key={row.id}
                  title={lighterPortCallPickerTitle(row)}
                  details={lighterPortCallPickerDetails(row)}
                  availability={hullBusy ? "used" : "free"}
                  selected={lighterCallId === row.id}
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
