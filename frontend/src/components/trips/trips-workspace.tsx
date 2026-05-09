"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { TripsAssignLighterSheet } from "@/components/trips/trips-assign-lighter-sheet";
import { TripsAssignMotherSheet } from "@/components/trips/trips-assign-mother-sheet";
import { TripsTripActivitySheet } from "@/components/trips/trips-trip-activity-sheet";
import { TripsTripEditSheet } from "@/components/trips/trips-trip-edit-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getUserProfile } from "@/lib/auth-storage";
import { fetchLighterTrips, fetchLighterVesselsForPicker, patchLighterTrip } from "@/lib/lighter-trips-api";
import { parseApiErr } from "@/lib/parse-api-error";
import { canEditLighterTrips } from "@/lib/trips-permissions";
import { fetchVesselCall, fetchVesselCalls } from "@/lib/vessel-calls-api";
import { applySearchParams } from "@/lib/workspace-paths";
import type {
  LighterTripListRow,
  LighterVesselPickerRow,
  Paginated,
  VesselCallListRow
} from "@/types/vms";

/** Backend rejects any PATCH when trip status is `CLOSED`. */
function tripLocked(status: string): boolean {
  return status === "CLOSED";
}

/** Same tile pattern as `VesselSofWorkspaceScaffold` / discharge picker — titles + details for `SelectablePickerCard`. */
function tripsMotherPickerTitle(row: VesselCallListRow): string {
  return row.vessel.name;
}

function tripsMotherPickerDetails(row: VesselCallListRow): string {
  const cargo = row.cargoNameSnapshot ? ` · ${row.cargoNameSnapshot}` : "";
  return `${row.callNo} · ${row.status}${cargo} · ${row._count.lighterTrips} trips · ${row._count.lighterAssignments} allocations`;
}

function tripsLighterPickerTitle(row: LighterVesselPickerRow): string {
  return row.name;
}

function tripsLighterPickerDetails(row: LighterVesselPickerRow): string {
  const imo = row.imoNo ? `IMO ${row.imoNo}` : "No IMO";
  const t = row.activeTrip;
  if (t) {
    return `${imo} · On trip ${t.tripNo} · ${t.vesselCall.vessel.name} (${t.vesselCall.callNo})`;
  }
  return `${imo} · Available for assignment`;
}

function TripsWorkspaceInner() {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const kind: "mother" | "lighter" = searchParams.get("kind") === "lighter" ? "lighter" : "mother";
  const vesselCallId = searchParams.get("vesselCallId")?.trim() ?? "";
  const lighterVesselId = searchParams.get("lighterVesselId")?.trim() ?? "";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignMotherOpen, setAssignMotherOpen] = useState(false);
  const [editTripId, setEditTripId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [activityTripId, setActivityTripId] = useState<string | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);

  const profile = useMemo(() => getUserProfile(), []);
  const canEdit = canEditLighterTrips(profile);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const setKind = (next: "mother" | "lighter") => {
    router.replace(
      applySearchParams(pathname, searchParams, {
        kind: next,
        vesselCallId: null,
        lighterVesselId: null
      }),
      { scroll: false }
    );
  };

  const selectMother = (id: string) => {
    router.replace(
      applySearchParams(pathname, searchParams, {
        kind: "mother",
        vesselCallId: id,
        lighterVesselId: null
      }),
      { scroll: false }
    );
  };

  const selectLighter = (id: string) => {
    router.replace(
      applySearchParams(pathname, searchParams, {
        kind: "lighter",
        lighterVesselId: id,
        vesselCallId: null
      }),
      { scroll: false }
    );
  };

  const clearSelection = () => {
    router.replace(`/trips?kind=${kind}`, { scroll: false });
  };

  const motherQ = useInfiniteQuery({
    queryKey: ["trips-vessel-call-picker", debouncedSearch],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      fetchVesselCalls({
        limit: 20,
        cursor: pageParam,
        search: debouncedSearch || undefined
      }),
    getNextPageParam: (last: Paginated<VesselCallListRow>) => last.nextCursor ?? undefined,
    enabled: kind === "mother"
  });

  const lighterQ = useQuery({
    queryKey: ["trips-lighter-hull-picker", debouncedSearch],
    queryFn: () => fetchLighterVesselsForPicker(debouncedSearch || undefined, 60),
    enabled: kind === "lighter"
  });

  const motherRows = useMemo(
    () => motherQ.data?.pages.flatMap((p) => p.data) ?? [],
    [motherQ.data]
  );
  const lighterRows = lighterQ.data ?? [];

  const motherMetaQ = useQuery({
    queryKey: ["vessel-call-trips-meta", vesselCallId],
    queryFn: () => fetchVesselCall(vesselCallId),
    enabled: kind === "mother" && !!vesselCallId
  });

  const lighterMetaQ = useQuery({
    queryKey: ["lighter-hull-trips-meta", lighterVesselId],
    queryFn: () =>
      fetchLighterVesselsForPicker(undefined, 5, lighterVesselId).then((r) => r[0] ?? null),
    enabled: kind === "lighter" && !!lighterVesselId
  });

  const tripsMotherQ = useQuery({
    queryKey: ["trips-by-vessel-call", vesselCallId],
    queryFn: () => fetchLighterTrips({ vesselCallId, limit: 80 }),
    enabled: kind === "mother" && !!vesselCallId
  });

  const tripsLighterQ = useQuery({
    queryKey: ["trips-by-lighter-hull", lighterVesselId],
    queryFn: () => fetchLighterTrips({ lighterVesselId, limit: 80 }),
    enabled: kind === "lighter" && !!lighterVesselId
  });

  const pickerLoading = kind === "mother" ? motherQ.isLoading : lighterQ.isLoading;
  const pickerFailed = kind === "mother" ? motherQ.isError : lighterQ.isError;
  const pickerErrMsg = kind === "mother" ? parseApiErr(motherQ.error) : parseApiErr(lighterQ.error);

  const loadMoreMother =
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

  const motherTitle =
    motherMetaQ.data != null
      ? `${motherMetaQ.data.vessel.name} · ${motherMetaQ.data.callNo}`
      : vesselCallId
        ? "this mother vessel call"
        : "";

  const invalidateForMother: Array<readonly string[]> = vesselCallId
    ? [
        ["trips-by-vessel-call", vesselCallId],
        ["open-lighter-assignments", vesselCallId]
      ]
    : [];

  const invalidateForLighter: Array<readonly string[]> = lighterVesselId
    ? [
        ["trips-by-lighter-hull", lighterVesselId],
        ["trips-lighter-hull-picker"],
        ["lighter-hulls-picker"]
      ]
    : [];

  const invalidateForTripSheets: Array<readonly string[]> = [
    ...invalidateForMother,
    ...invalidateForLighter,
    ["lighter-hulls-picker"]
  ];
  const hasSelection = kind === "mother" ? !!vesselCallId : !!lighterVesselId;
  const selectedMotherTitle = motherMetaQ.data
    ? `${motherMetaQ.data.vessel.name}`
    : vesselCallId
      ? "Selected mother vessel"
      : "";
  const selectedMotherDetails = motherMetaQ.data
    ? `${motherMetaQ.data.callNo} · ${motherMetaQ.data.status}${
        motherMetaQ.data.cargoNameSnapshot ? ` · ${motherMetaQ.data.cargoNameSnapshot}` : ""
      }`
    : vesselCallId || "";
  const selectedLighterTitle = lighterMetaQ.data?.name ?? (lighterVesselId ? "Selected lighter" : "");
  const selectedLighterDetails = lighterMetaQ.data?.imoNo
    ? `IMO ${lighterMetaQ.data.imoNo}`
    : lighterVesselId || "";
  const lighterIsFree = (lighterMetaQ.data?.activeTrip ?? null) == null;

  const deleteM = useMutation({
    mutationFn: (tripId: string) =>
      patchLighterTrip(tripId, {
        status: "CANCELLED",
        statusChangeRemarks: "Trip cancelled from Trips workspace"
      }),
    onSuccess: async () => {
      for (const key of invalidateForTripSheets) {
        await qc.invalidateQueries({ queryKey: key });
      }
      await qc.invalidateQueries({ queryKey: ["trips-vessel-call-picker"] });
      await qc.invalidateQueries({ queryKey: ["trips-lighter-hull-picker"] });
      await qc.invalidateQueries({ queryKey: ["lighter-hulls-picker"] });
    }
  });

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trips</h1>
        <p className="text-sm text-muted-foreground">
          {kind === "mother"
            ? "One mother vessel can have many lighters. Add, edit, or delete lighter assignments here."
            : "One lighter can work on only one mother vessel at a time. View past/current/next work and assign when free."}
        </p>
      </div>

      {hasSelection ? (
        <SelectedSofChip
          kind={kind}
          title={kind === "mother" ? selectedMotherTitle : selectedLighterTitle}
          details={
            (kind === "mother" ? selectedMotherDetails : selectedLighterDetails) || undefined
          }
          onChange={clearSelection}
        />
      ) : (
        <MotherLighterPickerCard
          toolbar={
            <MotherLighterPickerToolbar
              kind={kind}
              onKindChange={(next) => {
                setSearch("");
                setDebouncedSearch("");
                setKind(next);
              }}
              search={search}
              onSearchChange={setSearch}
              placeholderMother="Search call no., vessel, cargo…"
              placeholderLighter="Search lighter name, IMO…"
            />
          }
          footer={kind === "mother" ? loadMoreMother : null}
        >
          <PickerScrollArea>
            {pickerLoading ? (
              <PickerCardSkeletonGrid />
            ) : pickerFailed ? (
              <PickerErrorState message={pickerErrMsg} />
            ) : kind === "mother" ? (
              motherRows.length === 0 ? (
                <PickerEmptyState message="No mother vessel calls." />
              ) : (
                <PickerCardGrid>
                  {motherRows.map((row) => (
                    <SelectablePickerCard
                      key={row.id}
                      title={tripsMotherPickerTitle(row)}
                      details={tripsMotherPickerDetails(row)}
                      selected={vesselCallId === row.id}
                      onClick={() => selectMother(row.id)}
                    />
                  ))}
                </PickerCardGrid>
              )
            ) : (
              lighterRows.length === 0 ? (
                <PickerEmptyState message="No lighter hulls match." />
              ) : (
                <PickerCardGrid>
                  {lighterRows.map((row: LighterVesselPickerRow) => (
                    <SelectablePickerCard
                      key={row.id}
                      title={tripsLighterPickerTitle(row)}
                      details={tripsLighterPickerDetails(row)}
                      selected={lighterVesselId === row.id}
                      onClick={() => selectLighter(row.id)}
                    />
                  ))}
                </PickerCardGrid>
              )
            )}
          </PickerScrollArea>
        </MotherLighterPickerCard>
      )}

      {!hasSelection ? null : kind === "mother" ? (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">Lighters on this mother vessel</CardTitle>
              {motherMetaQ.isLoading ? (
                <Skeleton className="h-4 w-64" />
              ) : motherMetaQ.data ? (
                <p className="text-sm text-muted-foreground">
                  {motherMetaQ.data.vessel.name} · Call {motherMetaQ.data.callNo} ·{" "}
                  {motherMetaQ.data.status}
                  {motherMetaQ.data.cargoNameSnapshot
                    ? ` · ${motherMetaQ.data.cargoNameSnapshot}`
                    : ""}
                </p>
              ) : motherMetaQ.isError ? (
                <p className="text-sm text-destructive">{parseApiErr(motherMetaQ.error)}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {canEdit ? (
                <Button type="button" size="sm" onClick={() => setAssignOpen(true)}>
                  Assign lighter
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {tripsMotherQ.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : tripsMotherQ.isError ? (
              <p className="text-sm text-destructive">{parseApiErr(tripsMotherQ.error)}</p>
            ) : (
              <TripsTable
                rows={tripsMotherQ.data?.data ?? []}
                mode="mother"
                canEdit={canEdit}
                onDelete={(id) => {
                  const ok = window.confirm(
                    "Delete this assignment? This will cancel the trip and free the lighter when allowed."
                  );
                  if (!ok) return;
                  void deleteM.mutate(id);
                }}
                onEdit={(id) => {
                  setEditTripId(id);
                  setEditOpen(true);
                }}
                onActivity={(id) => {
                  setActivityTripId(id);
                  setActivityOpen(true);
                }}
              />
            )}
          </CardContent>
        </Card>
      ) : kind === "lighter" && lighterVesselId ? (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">Mother vessel for this lighter</CardTitle>
              {lighterMetaQ.isLoading ? (
                <Skeleton className="h-4 w-64" />
              ) : lighterMetaQ.isError ? (
                <p className="text-sm text-destructive">{parseApiErr(lighterMetaQ.error)}</p>
              ) : lighterMetaQ.data ? (
                <p className="text-sm text-muted-foreground">
                  Hull <span className="font-medium text-foreground">{lighterMetaQ.data.name}</span>
                  {lighterMetaQ.data.imoNo ? ` · IMO ${lighterMetaQ.data.imoNo}` : ""}
                </p>
              ) : (
                <p className="text-sm text-destructive">Could not load this lighter hull.</p>
              )}
            </div>
            {canEdit ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setAssignMotherOpen(true)}
                disabled={!lighterIsFree}
              >
                {lighterIsFree ? "Assign to mother vessel" : "Busy (finish current trip first)"}
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <p className="mb-4 text-sm text-muted-foreground">
              One lighter hull can only have one unfinished trip at a time. When the trip is
              unloaded, closed, or cancelled, the hull can be assigned to another mother vessel from
              the mother view.
            </p>
            {tripsLighterQ.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : tripsLighterQ.isError ? (
              <p className="text-sm text-destructive">{parseApiErr(tripsLighterQ.error)}</p>
            ) : (
              <TripsTable
                rows={tripsLighterQ.data?.data ?? []}
                mode="lighter"
                canEdit={canEdit}
                onDelete={(id) => {
                  const ok = window.confirm(
                    "Delete this assignment? This will cancel the trip and free the lighter when allowed."
                  );
                  if (!ok) return;
                  void deleteM.mutate(id);
                }}
                onEdit={(id) => {
                  setEditTripId(id);
                  setEditOpen(true);
                }}
                onActivity={(id) => {
                  setActivityTripId(id);
                  setActivityOpen(true);
                }}
              />
            )}
          </CardContent>
        </Card>
      ) : null}

      <TripsAssignLighterSheet
        vesselCallId={vesselCallId}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        canEdit={canEdit}
        motherTitle={motherTitle}
      />
      <TripsAssignMotherSheet
        lighterVesselId={lighterVesselId}
        open={assignMotherOpen}
        onOpenChange={setAssignMotherOpen}
        canEdit={canEdit}
        lighterTitle={selectedLighterTitle || "Selected lighter"}
      />
      <TripsTripEditSheet
        tripId={editTripId}
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditTripId(null);
        }}
        invalidateKeys={invalidateForTripSheets}
      />
      <TripsTripActivitySheet
        tripId={activityTripId}
        open={activityOpen}
        onOpenChange={(o) => {
          setActivityOpen(o);
          if (!o) setActivityTripId(null);
        }}
        invalidateKeys={invalidateForTripSheets}
      />
    </div>
  );
}

function TripsTable({
  rows,
  mode,
  canEdit,
  onDelete,
  onEdit,
  onActivity
}: {
  rows: LighterTripListRow[];
  mode: "mother" | "lighter";
  canEdit: boolean;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onActivity: (id: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {mode === "mother"
          ? "No lighter trips yet for this call. Use Assign lighter when you have open carrier allocations."
          : "No trips found for this hull (including completed trips in history)."}
      </p>
    );
  }

  return (
    <table className="w-full min-w-[36rem] border-collapse text-sm">
      <thead>
        <tr className="border-b border-border text-left">
          <th className="py-2 pr-3 font-medium">Trip</th>
          {mode === "mother" ? (
            <th className="py-2 pr-3 font-medium">Lighter</th>
          ) : (
            <>
              <th className="py-2 pr-3 font-medium">Mother vessel</th>
              <th className="py-2 pr-3 font-medium">Call</th>
            </>
          )}
          <th className="py-2 pr-3 font-medium">Status</th>
          <th className="py-2 pr-3 font-medium">SOF</th>
          <th className="py-2 pr-3 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((t) => {
          const locked = tripLocked(t.status);
          const done = ["UNLOADED", "CLOSED", "CANCELLED"].includes(t.status);
          const canDelete = !done;
          return (
            <tr key={t.id} className="border-b border-border/80">
              <td className="py-2 pr-3 font-medium">{t.tripNo}</td>
              {mode === "mother" ? (
                <td className="py-2 pr-3">{t.lighterVessel.name}</td>
              ) : (
                <>
                  <td className="py-2 pr-3">{t.vesselCall.vessel.name}</td>
                  <td className="py-2 pr-3">{t.vesselCall.callNo}</td>
                </>
              )}
              <td className="py-2 pr-3">
                <Badge variant={done ? "secondary" : "default"} className="font-normal">
                  {t.status.replaceAll("_", " ")}
                </Badge>
              </td>
              <td className="py-2 pr-3">
                {t.statementOfFacts ? (
                  <Link
                    href={`/lighter-sof/${t.statementOfFacts.id}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {t.statementOfFacts.sofNo}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="py-2 pl-3 text-right">
                <div className="flex flex-wrap justify-end gap-1">
                  {canEdit && !locked ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(t.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => onActivity(t.id)}
                      >
                        Activity
                      </Button>
                      {canDelete ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => onDelete(t.id)}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </>
                  ) : locked ? (
                    <span className="text-xs text-muted-foreground">Closed — cannot edit</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">View only</span>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function TripsWorkspace() {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full" />}>
      <TripsWorkspaceInner />
    </Suspense>
  );
}
