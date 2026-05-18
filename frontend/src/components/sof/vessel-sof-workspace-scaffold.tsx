"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { SofDetailPageSkeleton } from "@/components/sof/sof-detail-page-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MotherLighterPickerCard,
  PickerCardGrid,
  PickerCardSkeletonGrid,
  PickerEmptyState,
  PickerErrorState,
  PickerListToolbar,
  PickerScrollArea,
  SelectablePickerCard,
  SelectedSofChip
} from "@/components/workspace/mother-lighter-picker";
import { MotherLighterVesselPickerPanel } from "@/components/workspace/mother-lighter-vessel-picker-panel";
import { VesselSofAddEventEmptyState } from "@/components/sof/vessel-sof-add-event-empty-state";
import type { VesselSofWorkspaceSection } from "@/components/sof/detail/types";
import {
  fetchLighterSofChipPeek,
  fetchLighterSofs,
  fetchMotherSofChipPeek,
  fetchMotherSofs
} from "@/lib/sof-api";
import { parseApiErr } from "@/lib/parse-api-error";
import {
  filterLighterSofsForPortCall,
  resolveLighterSofIdForPortCall,
  resolveMotherSofIdForVesselCall
} from "@/lib/resolve-vessel-sof-selection";
import { fetchVesselCall, fetchVesselCalls } from "@/lib/vessel-calls-api";
import {
  applySearchParams,
  buildVesselSofWorkspaceUrl,
  reportsDischargePath,
  VESSEL_SOF_CLEAR_SELECTION_EVENT
} from "@/lib/workspace-paths";
import { cn } from "@/lib/utils";
import type { LighterSofListRow, MotherSofListRow, VesselCallListRow } from "@/types/vms";

const MotherSofDetailView = dynamic(
  () =>
    import("@/components/sof/detail/mother-sof-detail-view").then((m) => ({
      default: m.MotherSofDetailView
    })),
  { loading: () => <SofDetailPageSkeleton /> }
);

const LighterSofDetailView = dynamic(
  () =>
    import("@/components/sof/detail/lighter-sof-detail-view").then((m) => ({
      default: m.LighterSofDetailView
    })),
  { loading: () => <SofDetailPageSkeleton /> }
);

export type { VesselSofWorkspaceSection } from "@/components/sof/detail/types";

function sofPickerDetails(
  kind: "mother" | "lighter",
  r: MotherSofListRow | LighterSofListRow
): string {
  if (kind === "mother") {
    const row = r as MotherSofListRow;
    return row.vesselCall
      ? `${row.vesselCall.vessel.name} · ${row.vesselCall.callNo}`
      : "No vessel call";
  }
  const row = r as LighterSofListRow;
  return row.lighterTrip
    ? `${row.lighterTrip.lighterVessel.name} · Trip ${row.lighterTrip.tripNo} · ${row.lighterTrip.vesselCall?.callNo ?? "—"}`
    : "No trip";
}


function VesselSofWorkspaceScaffoldInner({
  section,
  reportsLinkBase = false
}: {
  section: VesselSofWorkspaceSection;
  reportsLinkBase?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const kind: "mother" | "lighter" = searchParams.get("kind") === "lighter" ? "lighter" : "mother";
  const vesselCallId = searchParams.get("vesselCallId")?.trim() ?? "";
  const lighterCallId = searchParams.get("lighterCallId")?.trim() ?? "";
  const legacyLighterHullId = searchParams.get("lighterVesselId")?.trim() ?? "";
  const id = searchParams.get("id")?.trim() ?? "";
  const pickSofMode = searchParams.get("pickSof") === "1";
  /** Stable snapshot — `searchParams` object identity changes often in Next.js; avoid effect churn / loops. */
  const searchParamsSnapshot = searchParams.toString();

  const hasVesselSelection = kind === "mother" ? !!vesselCallId : !!lighterCallId;
  const hasSofSelection = !!id;

  const [vesselSearch, setVesselSearch] = useState("");
  const debouncedVesselSearch = useDebouncedValue(vesselSearch, 300);
  const [sofSearch, setSofSearch] = useState("");

  /** “Change SOF” — back to vessel picker only (`?kind=mother` / `?kind=lighter`), no vessel or SOF ids. */
  const listHref = useMemo(() => {
    if (reportsLinkBase) {
      return reportsDischargePath(kind, {});
    }
    return applySearchParams(pathname, searchParams, {
      id: null,
      vesselCallId: null,
      lighterCallId: null,
      lighterVesselId: null,
      pickSof: null
    });
  }, [reportsLinkBase, kind, pathname, searchParams]);

  const clearVesselHref = useMemo(
    () =>
      reportsLinkBase
        ? reportsDischargePath(kind, { pickSof: null })
        : applySearchParams(pathname, searchParams, {
            vesselCallId: null,
            lighterCallId: null,
            lighterVesselId: null,
            id: null,
            pickSof: null
          }),
    [reportsLinkBase, kind, pathname, searchParams]
  );

  const setKind = (next: "mother" | "lighter") => {
    setVesselSearch("");
    setSofSearch("");
    if (reportsLinkBase) {
      router.replace(reportsDischargePath(next, { pickSof: null }), { scroll: false });
      return;
    }
    router.replace(
      applySearchParams(pathname, searchParams, {
        kind: next,
        vesselCallId: null,
        lighterCallId: null,
        lighterVesselId: null,
        id: null,
        pickSof: null
      }),
      { scroll: false }
    );
  };

  const selectMotherVesselRow = async (row: VesselCallListRow) => {
    setSofSearch("");
    let sofId: string | null = null;
    try {
      const page = await fetchMotherSofs({ vesselCallId: row.id, limit: 10 });
      sofId = resolveMotherSofIdForVesselCall(row.id, page.data);
    } catch {
      sofId = null;
    }

    qc.removeQueries({ queryKey: ["mother-sof-events"] });
    qc.removeQueries({ queryKey: ["vessel-sof-mother-sof-probe"] });

    const nextUrl = reportsLinkBase
      ? reportsDischargePath("mother", {
          vesselCallId: row.id,
          id: sofId,
          pickSof: null
        })
      : buildVesselSofWorkspaceUrl(pathname, {
          kind: "mother",
          vesselCallId: row.id,
          id: sofId
        });

    router.replace(nextUrl, { scroll: false });
  };

  const selectLighterCallRow = async (row: VesselCallListRow) => {
    setSofSearch("");
    let sofId: string | null = null;
    try {
      const page = await fetchLighterSofs({ lighterVesselId: row.vessel.id, limit: 40 });
      sofId = resolveLighterSofIdForPortCall(row.id, page.data);
    } catch {
      sofId = null;
    }
    const nextUrl = reportsLinkBase
      ? reportsDischargePath("lighter", {
          lighterCallId: row.id,
          id: sofId,
          pickSof: null
        })
      : buildVesselSofWorkspaceUrl(pathname, {
          kind: "lighter",
          lighterCallId: row.id,
          id: sofId
        });

    router.replace(nextUrl, { scroll: false });
  };

  const pickSof = (rowId: string) => {
    if (reportsLinkBase) {
      router.replace(
        reportsDischargePath(kind, {
          id: rowId,
          vesselCallId: vesselCallId || null,
          lighterCallId: lighterCallId || null,
          pickSof: null
        }),
        { scroll: false }
      );
      return;
    }
    router.replace(
      applySearchParams(pathname, searchParams, { id: rowId, kind, pickSof: null }),
      { scroll: false }
    );
  };

  const notifySheetsBeforeClearSelection = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(VESSEL_SOF_CLEAR_SELECTION_EVENT));
    }
  }, []);

  const motherVesselMetaQ = useQuery({
    queryKey: ["vessel-call-meta", vesselCallId],
    queryFn: () => fetchVesselCall(vesselCallId),
    enabled: kind === "mother" && !!vesselCallId && !hasSofSelection
  });

  const lighterCallMetaQ = useQuery({
    queryKey: ["lighter-call-meta", lighterCallId],
    queryFn: () => fetchVesselCall(lighterCallId),
    enabled: kind === "lighter" && !!lighterCallId && !hasSofSelection
  });

  const lighterHullIdResolved = lighterCallMetaQ.data?.vessel.id ?? "";

  const legacyLighterCallResolveQ = useQuery({
    queryKey: ["legacy-lighter-hull-to-call", legacyLighterHullId],
    queryFn: () =>
      fetchVesselCalls({
        hullKind: "lighter",
        vesselId: legacyLighterHullId,
        limit: 10
      }),
    enabled:
      kind === "lighter" &&
      !lighterCallId &&
      !!legacyLighterHullId &&
      !hasSofSelection &&
      !id
  });

  useEffect(() => {
    if (kind !== "lighter" || lighterCallId || !legacyLighterHullId || id) return;
    if (!legacyLighterCallResolveQ.isSuccess || legacyLighterCallResolveQ.isFetching) return;
    const rows = legacyLighterCallResolveQ.data?.data ?? [];
    if (rows.length === 0) return;
    const chosen = rows[0]!;
    router.replace(
      applySearchParams(pathname, searchParams, {
        lighterCallId: chosen.id,
        lighterVesselId: null
      }),
      { scroll: false }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `searchParamsSnapshot` tracks URL; Next `searchParams` identity churn would retrigger redirects.
  }, [
    kind,
    lighterCallId,
    legacyLighterHullId,
    id,
    legacyLighterCallResolveQ.isSuccess,
    legacyLighterCallResolveQ.isFetching,
    legacyLighterCallResolveQ.data,
    pathname,
    searchParamsSnapshot,
    router
  ]);

  const motherProbeQ = useQuery({
    queryKey: ["vessel-sof-mother-sof-probe", vesselCallId],
    queryFn: () => fetchMotherSofs({ vesselCallId, limit: 10 }),
    enabled: kind === "mother" && !!vesselCallId && !id
  });

  const lighterProbeQ = useQuery({
    queryKey: ["vessel-sof-lighter-sof-probe", lighterHullIdResolved, lighterCallId],
    queryFn: () => fetchLighterSofs({ lighterVesselId: lighterHullIdResolved, limit: 40 }),
    enabled: kind === "lighter" && !!lighterCallId && !!lighterHullIdResolved && !id
  });

  const motherProbeRowsForCall = useMemo(() => {
    const rows = motherProbeQ.data?.data ?? [];
    return rows.filter((r) => r.vesselCall?.id === vesselCallId);
  }, [motherProbeQ.data, vesselCallId]);

  const nMotherProbe = motherProbeRowsForCall.length;
  const nLighterProbe = lighterProbeQ.data?.data?.length ?? 0;

  const showLighterDisambig =
    kind === "lighter" &&
    !!lighterCallId &&
    !!lighterHullIdResolved &&
    !id &&
    lighterProbeQ.isSuccess &&
    nLighterProbe > 1;

  const lighterDisambigQ = useQuery({
    queryKey: ["vessel-sof-lighter-disambig", lighterHullIdResolved, sofSearch],
    queryFn: () =>
      fetchLighterSofs({
        lighterVesselId: lighterHullIdResolved,
        limit: 40,
        search: sofSearch || undefined
      }),
    enabled: showLighterDisambig,
    /** Don’t reuse tiles from a previous lighter hull after URL/context changes. */
    staleTime: 0,
    gcTime: 0
  });

  const disambigRows = lighterDisambigQ.data?.data ?? [];

  /** Only while picking among multiple lighter SOFs — avoids stale TanStack cache breaking peek/detail for mother or single-SOF lighter. */
  const selectedRow =
    showLighterDisambig && id ? (disambigRows.find((r) => r.id === id) ?? null) : null;

  const motherPeekQ = useQuery({
    queryKey: ["mother-sof", id, "workspace-chip"],
    queryFn: () => fetchMotherSofChipPeek(id),
    enabled: hasSofSelection && kind === "mother"
  });

  const lighterPeekQ = useQuery({
    queryKey: ["lighter-sof", id, "workspace-chip"],
    queryFn: () => fetchLighterSofChipPeek(id),
    enabled: hasSofSelection && kind === "lighter"
  });

  const sectionTitle =
    section === "overview"
      ? "Overview"
      : section === "events"
        ? "SOF"
        : section === "laytime"
          ? "Laytime calculation"
          : "Discharge";

  const selectedChipTitle = selectedRow
    ? kind === "mother"
      ? ((selectedRow as unknown as MotherSofListRow).vesselCall?.vessel.name ?? selectedRow.sofNo)
      : ((selectedRow as unknown as LighterSofListRow).lighterTrip?.lighterVessel.name ??
          selectedRow.sofNo)
    : kind === "mother" && motherPeekQ.data?.vesselCall
      ? motherPeekQ.data.vesselCall.vessel.name
      : kind === "lighter" && lighterPeekQ.data?.lighterTrip
        ? lighterPeekQ.data.lighterTrip.lighterVessel.name
        : "Selected vessel";

  const selectedChipDetails = selectedRow
    ? kind === "mother"
      ? (() => {
          const row = selectedRow as unknown as MotherSofListRow;
          return row.vesselCall?.callNo ? `Call ${row.vesselCall.callNo}` : "No call linked";
        })()
      : (() => {
          const row = selectedRow as unknown as LighterSofListRow;
          return row.lighterTrip
            ? `Call ${row.lighterTrip.vesselCall?.callNo ?? "—"} · Trip ${row.lighterTrip.tripNo}`
            : "No trip";
        })()
    : kind === "mother" && motherPeekQ.data?.vesselCall
      ? `Call ${motherPeekQ.data.vesselCall.callNo}`
      : kind === "lighter" && lighterPeekQ.data?.lighterTrip
        ? `Call ${lighterPeekQ.data.lighterTrip.vesselCall?.callNo ?? "—"} · Trip ${lighterPeekQ.data.lighterTrip.tripNo}`
        : "";

  const selectedMotherVesselTitle =
    motherVesselMetaQ.data != null
      ? `${motherVesselMetaQ.data.vessel.name} · ${motherVesselMetaQ.data.callNo}`
      : vesselCallId
        ? "Mother vessel call"
        : "";

  const selectedMotherVesselDetails =
    motherVesselMetaQ.data != null
      ? `${motherVesselMetaQ.data.callNo} · ${motherVesselMetaQ.data.status}${
          motherVesselMetaQ.data.cargoNameSnapshot
            ? ` · ${motherVesselMetaQ.data.cargoNameSnapshot}`
            : ""
        }`
      : vesselCallId || "";

  const selectedLighterCallTitle =
    lighterCallMetaQ.data != null
      ? `${lighterCallMetaQ.data.callNo} · ${lighterCallMetaQ.data.vessel.name}`
      : lighterCallId
        ? "Lighter port call"
        : "";
  const selectedLighterCallDetails =
    lighterCallMetaQ.data != null
      ? `${lighterCallMetaQ.data.status}${
          lighterCallMetaQ.data.cargoNameSnapshot
            ? ` · ${lighterCallMetaQ.data.cargoNameSnapshot}`
            : ""
        }`
      : lighterCallId || "";

  const topChrome = (() => {
    if (hasSofSelection) {
      return (
        <SelectedSofChip
          kind={kind}
          title={selectedChipTitle}
          details={selectedChipDetails || undefined}
          changeHref={listHref}
          onNavigateClick={notifySheetsBeforeClearSelection}
        />
      );
    }
    if (hasVesselSelection && hasSofSelection) {
      return (
        <SelectedSofChip
          kind={kind}
          title={kind === "mother" ? selectedMotherVesselTitle : selectedLighterCallTitle}
          details={
            (kind === "mother" ? selectedMotherVesselDetails : selectedLighterCallDetails) ||
            undefined
          }
          changeLabel="Change vessel"
          changeHref={clearVesselHref}
          onNavigateClick={notifySheetsBeforeClearSelection}
        />
      );
    }
    if (hasVesselSelection && !hasSofSelection) {
      return (
        <div className="space-y-2">
          <SelectedSofChip
            kind={kind}
            title={kind === "mother" ? selectedMotherVesselTitle : selectedLighterCallTitle}
            details={
              (kind === "mother" ? selectedMotherVesselDetails : selectedLighterCallDetails) ||
              undefined
            }
            changeLabel="Clear"
            changeHref={clearVesselHref}
            onNavigateClick={notifySheetsBeforeClearSelection}
          />
          <MotherLighterVesselPickerPanel
            kind={kind}
            vesselCallId={vesselCallId}
            lighterCallId={lighterCallId}
            search={vesselSearch}
            debouncedSearch={debouncedVesselSearch}
            onSearchChange={setVesselSearch}
            onKindChange={setKind}
            onSelectMother={selectMotherVesselRow}
            onSelectLighter={selectLighterCallRow}
            queriesEnabled
          />
        </div>
      );
    }
    return (
      <MotherLighterVesselPickerPanel
        kind={kind}
        vesselCallId={vesselCallId}
        lighterCallId={lighterCallId}
        search={vesselSearch}
        debouncedSearch={debouncedVesselSearch}
        onSearchChange={setVesselSearch}
        onKindChange={setKind}
        onSelectMother={selectMotherVesselRow}
        onSelectLighter={selectLighterCallRow}
        queriesEnabled={!hasSofSelection && !hasVesselSelection}
        trailing={
          <Button variant="outline" size="sm" className="w-full lg:w-auto" asChild>
            <Link href="/vessel-calls">New vessel call</Link>
          </Button>
        }
      />
    );
  })();

  const sofPickerCard = showLighterDisambig ? (
    <MotherLighterPickerCard
      toolbar={
        <PickerListToolbar
          search={sofSearch}
          onSearchChange={setSofSearch}
          placeholder="Search SOF no. or trip…"
          trailing={
            <Button variant="outline" size="sm" className="w-full lg:w-auto" asChild>
              <Link href="/vessel-calls">New vessel call</Link>
            </Button>
          }
        />
      }
    >
      <PickerScrollArea>
        {lighterDisambigQ.isLoading ? (
          <PickerCardSkeletonGrid />
        ) : lighterDisambigQ.isError ? (
          <PickerErrorState message="Could not load SOFs." />
        ) : disambigRows.length === 0 ? (
          <PickerEmptyState message="No matching SOFs." />
        ) : (
          <PickerCardGrid>
            {disambigRows.map((r) => (
              <SelectablePickerCard
                key={r.id}
                title={r.sofNo}
                details={sofPickerDetails("lighter", r)}
                selected={id === r.id}
                onClick={() => pickSof(r.id)}
              />
            ))}
          </PickerCardGrid>
        )}
      </PickerScrollArea>
    </MotherLighterPickerCard>
  ) : null;

  const showMotherNoSof =
    kind === "mother" && !!vesselCallId && !id && motherProbeQ.isSuccess && nMotherProbe === 0;
  const showLighterNoSof =
    kind === "lighter" &&
    !!lighterCallId &&
    !!lighterHullIdResolved &&
    !id &&
    lighterProbeQ.isSuccess &&
    nLighterProbe === 0;

  const helpText = hasSofSelection
    ? `Showing ${sectionTitle.toLowerCase()} for the selected SOF — use “Change SOF” above to pick a different one.${
        section === "laytime"
          ? " After Recalculate, the results panel matches your plan’s laytime summary (allowed vs. used, demurrage / despatch, exclusions); the full worksheet is below."
          : ""
      }`
    : hasVesselSelection && showLighterDisambig
      ? "Several SOFs exist for this lighter. Pick one above."
      : hasVesselSelection && (showMotherNoSof || showLighterNoSof)
        ? `No SOF on this call yet — use Add event below to create one and record times.`
        : hasVesselSelection
          ? `Opening ${sectionTitle.toLowerCase()} for this vessel…`
          : `Choose a mother vessel call or lighter port call. When there is exactly one lighter SOF for that hull, it opens below automatically.`;

  const showMotherProbeErr =
    kind === "mother" && !!vesselCallId && !id && motherProbeQ.isError;
  const showLighterProbeErr =
    kind === "lighter" && !!lighterCallId && !!lighterHullIdResolved && !id && lighterProbeQ.isError;

  const bodyLoadingMother =
    kind === "mother" &&
    !!vesselCallId &&
    !id &&
    motherProbeQ.isPending &&
    !pickSofMode &&
    !motherProbeQ.isError;
  const bodyLoadingLighter =
    kind === "lighter" &&
    !!lighterCallId &&
    !id &&
    (lighterCallMetaQ.isPending ||
      (!!lighterHullIdResolved && lighterProbeQ.isPending)) &&
    !pickSofMode &&
    !lighterCallMetaQ.isError &&
    !lighterProbeQ.isError;

  const compactMain =
    hasSofSelection && (section === "events" || section === "laytime");

  const showMotherOpenSingleSof =
    kind === "mother" &&
    !!vesselCallId &&
    !id &&
    motherProbeQ.isSuccess &&
    motherProbeRowsForCall.length === 1;

  const lighterSofIdMismatch =
    kind === "lighter" &&
    !!lighterCallId &&
    !!id &&
    lighterPeekQ.isSuccess &&
    (() => {
      const trip = lighterPeekQ.data?.lighterTrip;
      if (!trip) return false;
      return (
        trip.lighterPortCallId !== lighterCallId && trip.vesselCall?.id !== lighterCallId
      );
    })();

  const showSofDetail = hasSofSelection && !lighterSofIdMismatch;

  const openMotherSingleSof = useCallback(() => {
    const row = motherProbeRowsForCall[0];
    if (!row) return;
    const nextUrl = reportsLinkBase
      ? reportsDischargePath("mother", { vesselCallId, id: row.id, pickSof: null })
      : buildVesselSofWorkspaceUrl(pathname, { kind: "mother", vesselCallId, id: row.id });
    router.replace(nextUrl, { scroll: false });
  }, [motherProbeRowsForCall, reportsLinkBase, pathname, router, vesselCallId]);

  return (
    <div className={cn("w-full", compactMain ? "space-y-1" : "space-y-6")}>
      <div
        className={cn(
          section === "laytime" && "laytime-print-suppress",
          compactMain && "mb-1"
        )}
      >
        {topChrome}
      </div>
      {sofPickerCard}

      <div
        className={cn(
          "w-full min-w-0",
          hasSofSelection && (section === "events" || section === "laytime")
            ? "space-y-2"
            : "space-y-4"
        )}
      >
        {hasSofSelection && (section === "events" || section === "laytime") ? null : (
          <div className={section === "laytime" ? "laytime-print-suppress pb-0" : undefined}>
            {section === "laytime" ? (
              <p className="text-sm text-muted-foreground">Select a vessel call below.</p>
            ) : (
              <>
                <h1 className="text-2xl font-bold tracking-tight">{sectionTitle}</h1>
                <p className="text-sm text-muted-foreground">{helpText}</p>
              </>
            )}
          </div>
        )}

        {showSofDetail ? (
          kind === "mother" ? (
            <MotherSofDetailView
              key={`mother-${vesselCallId}-${id}`}
              id={id}
              listHref={listHref}
              workspaceSection={section}
              hideWorkspaceChrome
            />
          ) : (
            <LighterSofDetailView
              key={`lighter-${lighterCallId}-${id}`}
              id={id}
              listHref={listHref}
              workspaceSection={section}
              hideWorkspaceChrome
            />
          )
        ) : showMotherOpenSingleSof ? (
          <Card className="w-full">
            <CardContent className="space-y-3 py-8 text-center text-sm">
              <p className="text-muted-foreground">
                One statement of facts exists for this vessel call.
              </p>
              <Button type="button" onClick={openMotherSingleSof}>
                Open {motherProbeRowsForCall[0]!.sofNo}
              </Button>
            </CardContent>
          </Card>
        ) : bodyLoadingMother || bodyLoadingLighter ? (
          <Skeleton className="h-48 w-full" />
        ) : showMotherProbeErr ? (
          <Card className="w-full border-destructive/40">
            <CardContent className="space-y-2 py-6 text-center text-sm">
              <p className="text-destructive">Could not load SOFs for this vessel call.</p>
              <p className="text-muted-foreground">{parseApiErr(motherProbeQ.error)}</p>
              <Button type="button" variant="secondary" onClick={() => void motherProbeQ.refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : showLighterProbeErr ? (
          <Card className="w-full border-destructive/40">
            <CardContent className="space-y-2 py-6 text-center text-sm">
              <p className="text-destructive">Could not load SOFs for this lighter.</p>
              <p className="text-muted-foreground">{parseApiErr(lighterProbeQ.error)}</p>
              <Button type="button" variant="secondary" onClick={() => void lighterProbeQ.refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : showMotherNoSof ? (
          <VesselSofAddEventEmptyState
            kind="mother"
            vesselCallId={vesselCallId}
            lighterCallId=""
            pathname={pathname}
            sectionLabel={sectionTitle}
          />
        ) : showLighterNoSof ? (
          <VesselSofAddEventEmptyState
            kind="lighter"
            vesselCallId=""
            lighterCallId={lighterCallId}
            pathname={pathname}
            sectionLabel={sectionTitle}
          />
        ) : showLighterDisambig ? (
          <p className="text-center text-sm text-muted-foreground">
            Choose a statement of facts in the list above.
          </p>
        ) : (
          <Card className="w-full">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Select a mother vessel call or lighter port call above to view {sectionTitle.toLowerCase()}.
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}

export function VesselSofWorkspaceScaffold({
  section,
  reportsLinkBase = false
}: {
  section: VesselSofWorkspaceSection;
  reportsLinkBase?: boolean;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full" />}>
      <VesselSofWorkspaceScaffoldInner section={section} reportsLinkBase={reportsLinkBase} />
    </Suspense>
  );
}
