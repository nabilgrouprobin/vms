"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { SofDetailPageSkeleton } from "@/components/sof/sof-detail-page-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MotherLighterPickerCard,
  MotherLighterPickerToolbar,
  PickerCardGrid,
  PickerCardSkeletonGrid,
  PickerEmptyState,
  PickerErrorState,
  PickerScrollArea,
  SelectablePickerCard,
  SelectedSofChip
} from "@/components/workspace/mother-lighter-picker";
import type { VesselSofWorkspaceSection } from "@/components/sof/detail/types";
import { fetchLighterSofs, fetchMotherSofs } from "@/lib/sof-api";
import { applySearchParams, reportsDischargePath } from "@/lib/workspace-paths";
import type { LighterSofListRow, MotherSofListRow, Paginated } from "@/types/vms";

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
  /** When true, URLs use `/reports?view=discharge&…` (Reports menu). */
  reportsLinkBase?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const kind: "mother" | "lighter" = searchParams.get("kind") === "lighter" ? "lighter" : "mother";
  const id = searchParams.get("id")?.trim() ?? "";
  const [search, setSearch] = useState("");

  /** List / header links without a selected SOF (same as clearing `id` on the current page). */
  const listHref = useMemo(
    () =>
      reportsLinkBase
        ? reportsDischargePath(kind, null)
        : applySearchParams(pathname, searchParams, { id: null }),
    [reportsLinkBase, kind, pathname, searchParams]
  );

  const setKind = (next: "mother" | "lighter") => {
    if (reportsLinkBase) {
      router.replace(reportsDischargePath(next, null), { scroll: false });
      return;
    }
    router.replace(
      applySearchParams(pathname, searchParams, {
        kind: next,
        ...(id ? { id } : { id: null })
      }),
      { scroll: false }
    );
  };

  const pick = (rowId: string) => {
    router.replace(
      applySearchParams(pathname, searchParams, { kind, id: rowId }),
      { scroll: false }
    );
  };

  const clearSelection = () => {
    router.replace(applySearchParams(pathname, searchParams, { id: null }), { scroll: false });
  };

  const listQ = useInfiniteQuery({
    queryKey: [
      "vessel-sof-picker",
      section,
      kind,
      search,
      reportsLinkBase ? "reports" : "vessel-sof"
    ],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      kind === "mother"
        ? fetchMotherSofs({ limit: 20, cursor: pageParam, search: search || undefined })
        : fetchLighterSofs({ limit: 20, cursor: pageParam, search: search || undefined }),
    getNextPageParam: (last: Paginated<MotherSofListRow | LighterSofListRow>) =>
      last.nextCursor ?? undefined
  });

  const rows = useMemo(() => listQ.data?.pages.flatMap((p) => p.data) ?? [], [listQ.data]);

  /** Selected SOF row, if it happens to be in the currently loaded page. */
  const selectedRow = useMemo(
    () => (id ? rows.find((r) => r.id === id) ?? null : null),
    [rows, id]
  );

  const sectionTitle =
    section === "overview"
      ? "Overview"
      : section === "events"
        ? "Events"
        : section === "laytime"
          ? "Laytime calculation"
          : "Discharge";

  const loadMoreFooter = listQ.hasNextPage ? (
    <Button
      variant="secondary"
      size="sm"
      className="w-full sm:w-auto"
      disabled={listQ.isFetchingNextPage}
      onClick={() => void listQ.fetchNextPage()}
    >
      {listQ.isFetchingNextPage ? "Loading…" : "Load more"}
    </Button>
  ) : null;

  const selectedChipTitle = selectedRow?.sofNo ?? "Selected SOF";
  const selectedChipDetails = selectedRow ? sofPickerDetails(kind, selectedRow) : "";

  return (
    <div className="w-full space-y-6">
      {id ? (
        <SelectedSofChip
          kind={kind}
          title={selectedChipTitle}
          details={selectedChipDetails || undefined}
          onChange={clearSelection}
        />
      ) : (
        <MotherLighterPickerCard
          toolbar={
            <MotherLighterPickerToolbar
              kind={kind}
              onKindChange={setKind}
              search={search}
              onSearchChange={setSearch}
              placeholderMother="Search mother SOF…"
              placeholderLighter="Search lighter SOF…"
              trailing={
                <Button variant="outline" size="sm" className="w-full lg:w-auto" asChild>
                  <Link href={kind === "mother" ? "/mother-sof/new" : "/lighter-sof/new"}>
                    New {kind === "mother" ? "mother" : "lighter"} SOF
                  </Link>
                </Button>
              }
            />
          }
          footer={loadMoreFooter}
        >
          <PickerScrollArea>
            {listQ.isLoading ? (
              <PickerCardSkeletonGrid />
            ) : listQ.isError ? (
              <PickerErrorState message="Could not load the list." />
            ) : rows.length === 0 ? (
              <PickerEmptyState message="No matches." />
            ) : (
              <PickerCardGrid>
                {rows.map((r) => (
                  <SelectablePickerCard
                    key={r.id}
                    title={r.sofNo}
                    details={sofPickerDetails(kind, r)}
                    selected={id === r.id}
                    onClick={() => pick(r.id)}
                  />
                ))}
              </PickerCardGrid>
            )}
          </PickerScrollArea>
        </MotherLighterPickerCard>
      )}

      <div className="w-full min-w-0 space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{sectionTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {id
              ? `Showing ${sectionTitle.toLowerCase()} for the selected SOF — use “Change SOF” above to pick a different one.`
              : `Pick a statement of facts above to work on ${sectionTitle.toLowerCase()} for that record.`}
          </p>
        </div>

        {id ? (
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
        ) : (
          <Card className="w-full">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Select a statement of facts from the list above to view {sectionTitle.toLowerCase()}.
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
