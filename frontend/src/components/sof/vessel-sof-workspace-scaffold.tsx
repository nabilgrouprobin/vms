"use client";

import { useQuery } from "@tanstack/react-query";
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
import type { VesselSofWorkspaceSection } from "@/components/sof/detail/types";
import {
  fetchLighterSofChipPeek,
  fetchLighterSofs,
  fetchMotherSofChipPeek,
  fetchMotherSofs
} from "@/lib/sof-api";
import { parseApiErr } from "@/lib/parse-api-error";
import { fetchVesselCall, fetchVesselCalls } from "@/lib/vessel-calls-api";
import {
  applySearchParams,
  lighterSofNewPath,
  reportsDischargePath,
  VESSEL_SOF_CLEAR_SELECTION_EVENT
} from "@/lib/workspace-paths";
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
    let sofId: string | null =
      row.statementOfFacts?.scope === "MOTHER_VESSEL" ? row.statementOfFacts.id : null;
    try {
      if (!sofId) {
        const page = await fetchMotherSofs({ vesselCallId: row.id, limit: 5 });
        const mother = page.data.find((r) => r.vesselCall?.id === row.id) ?? page.data[0];
        sofId = mother?.id ?? null;
      }
    } catch {
      sofId = null;
    }
    if (reportsLinkBase) {
      router.replace(
        reportsDischargePath("mother", {
          vesselCallId: row.id,
          id: sofId,
          pickSof: null
        }),
        { scroll: false }
      );
      return;
    }
    router.replace(
      applySearchParams(pathname, searchParams, {
        kind: "mother",
        vesselCallId: row.id,
        lighterCallId: null,
        lighterVesselId: null,
        id: sofId ?? null,
        pickSof: null
      }),
      { scroll: false }
    );
  };

  const selectLighterCallRow = async (row: VesselCallListRow) => {
    setSofSearch("");
    const hullId = row.vessel.id;
    let sofId: string | null = null;
    try {
      const page = await fetchLighterSofs({ lighterVesselId: hullId, limit: 25 });
      const list = page.data;
      sofId = list.length === 1 ? list[0].id : null;
    } catch {
      sofId = null;
    }
    if (reportsLinkBase) {
      router.replace(
        reportsDischargePath("lighter", {
          lighterCallId: row.id,
          id: sofId,
          pickSof: null
        }),
        { scroll: false }
      );
      return;
    }
    router.replace(
      applySearchParams(pathname, searchParams, {
        kind: "lighter",
        lighterCallId: row.id,
        lighterVesselId: null,
        vesselCallId: null,
        id: sofId ?? null,
        pickSof: null
      }),
      { scroll: false }
    );
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
    queryKey: ["vessel-sof-lighter-sof-probe", lighterHullIdResolved],
    queryFn: () => fetchLighterSofs({ lighterVesselId: lighterHullIdResolved, limit: 25 }),
    enabled: kind === "lighter" && !!lighterCallId && !!lighterHullIdResolved && !id
  });

  useEffect(() => {
    if (pickSofMode || kind !== "mother" || !vesselCallId || id) return;
    if (!motherProbeQ.isSuccess || motherProbeQ.isFetching) return;
    const rows = motherProbeQ.data?.data ?? [];
    if (rows.length !== 1) return;
    if (reportsLinkBase) {
      router.replace(
        reportsDischargePath("mother", { vesselCallId, id: rows[0].id, pickSof: null }),
        { scroll: false }
      );
    } else {
      router.replace(
        applySearchParams(pathname, searchParams, {
          kind: "mother",
          vesselCallId,
          id: rows[0].id,
          pickSof: null
        }),
        { scroll: false }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `searchParamsSnapshot` tracks URL; Next `searchParams` identity churn would retrigger redirects.
  }, [
    pickSofMode,
    kind,
    vesselCallId,
    id,
    motherProbeQ.isSuccess,
    motherProbeQ.isFetching,
    motherProbeQ.data,
    reportsLinkBase,
    pathname,
    searchParamsSnapshot,
    router
  ]);

  useEffect(() => {
    if (pickSofMode || kind !== "lighter" || !lighterCallId || !lighterHullIdResolved || id) return;
    if (!lighterProbeQ.isSuccess || lighterProbeQ.isFetching) return;
    const rows = lighterProbeQ.data?.data ?? [];
    if (rows.length !== 1) return;
    if (reportsLinkBase) {
      router.replace(
        reportsDischargePath("lighter", { lighterCallId, id: rows[0].id, pickSof: null }),
        { scroll: false }
      );
    } else {
      router.replace(
        applySearchParams(pathname, searchParams, {
          kind: "lighter",
          lighterCallId,
          id: rows[0].id,
          pickSof: null
        }),
        { scroll: false }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `searchParamsSnapshot` tracks URL; Next `searchParams` identity churn would retrigger redirects.
  }, [
    pickSofMode,
    kind,
    lighterCallId,
    lighterHullIdResolved,
    id,
    lighterProbeQ.isSuccess,
    lighterProbeQ.isFetching,
    lighterProbeQ.data,
    reportsLinkBase,
    pathname,
    searchParamsSnapshot,
    router
  ]);

  const nMotherProbe = motherProbeQ.data?.data?.length ?? 0;
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
        ? "Events"
        : section === "laytime"
          ? "Laytime calculation"
          : "Discharge";

  const helpText = hasSofSelection
    ? `Showing ${sectionTitle.toLowerCase()} for the selected SOF — use “Change SOF” above to pick a different one.`
    : hasVesselSelection && showLighterDisambig
      ? "Several SOFs exist for this lighter. Pick one above."
      : hasVesselSelection
        ? `Opening ${sectionTitle.toLowerCase()} for this vessel…`
        : `Choose a mother vessel call or lighter port call. When there is exactly one lighter SOF for that hull, it opens below automatically.`;

  const selectedChipTitle = selectedRow
    ? selectedRow.sofNo
    : kind === "mother" && motherPeekQ.data
      ? motherPeekQ.data.sofNo
      : kind === "lighter" && lighterPeekQ.data
        ? lighterPeekQ.data.sofNo
        : "Selected SOF";

  const selectedChipDetails = selectedRow
    ? sofPickerDetails(kind, selectedRow)
    : kind === "mother" && motherPeekQ.data
      ? motherPeekQ.data.vesselCall
        ? `${motherPeekQ.data.vesselCall.vessel.name} · ${motherPeekQ.data.vesselCall.callNo}`
        : "No vessel call"
      : kind === "lighter" && lighterPeekQ.data?.lighterTrip
        ? `${lighterPeekQ.data.lighterTrip.lighterVessel.name} · Trip ${lighterPeekQ.data.lighterTrip.tripNo} · ${lighterPeekQ.data.lighterTrip.vesselCall?.callNo ?? "—"}`
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
    if (hasVesselSelection) {
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
            <Link
              href={
                kind === "mother"
                  ? "/mother-sof/new"
                  : lighterSofNewPath({
                      lighterCallId: lighterCallId || null,
                      lighterVesselId: legacyLighterHullId || null
                    })
              }
            >
              New {kind === "mother" ? "mother" : "lighter"} SOF
            </Link>
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
              <Link
                href={lighterSofNewPath({
                  lighterCallId: lighterCallId || null,
                  lighterVesselId: legacyLighterHullId || null
                })}
              >
                New lighter SOF
              </Link>
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

  return (
    <div className="w-full space-y-6">
      {topChrome}
      {sofPickerCard}

      <div className="w-full min-w-0 space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{sectionTitle}</h1>
          <p className="text-sm text-muted-foreground">{helpText}</p>
        </div>

        {hasSofSelection ? (
          kind === "mother" ? (
            <MotherSofDetailView
              id={id}
              listHref={listHref}
              workspaceSection={section}
              hideWorkspaceChrome
            />
          ) : (
            <LighterSofDetailView
              id={id}
              listHref={listHref}
              workspaceSection={section}
              hideWorkspaceChrome
            />
          )
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
          <Card className="w-full">
            <CardContent className="space-y-3 py-8 text-center text-sm">
              <p className="text-muted-foreground">
                No mother vessel SOF exists for this call yet. Create one to use{" "}
                {sectionTitle.toLowerCase()}.
              </p>
              <Button asChild variant="secondary">
                <Link href="/mother-sof/new">Create mother SOF</Link>
              </Button>
            </CardContent>
          </Card>
        ) : showLighterNoSof ? (
          <Card className="w-full">
            <CardContent className="space-y-3 py-8 text-center text-sm">
              <p className="text-muted-foreground">
                No lighter SOF exists for this hull yet. Create one to use {sectionTitle.toLowerCase()}.
              </p>
              <Button asChild variant="secondary">
                <Link
                  href={lighterSofNewPath({
                    lighterCallId: lighterCallId || null,
                    lighterVesselId: legacyLighterHullId || null
                  })}
                >
                  Create lighter SOF
                </Link>
              </Button>
            </CardContent>
          </Card>
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
