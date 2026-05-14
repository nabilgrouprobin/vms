"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { TripsAssignLighterSheet } from "@/components/trips/trips-assign-lighter-sheet";
import { TripsAssignMotherSheet } from "@/components/trips/trips-assign-mother-sheet";
import { TripsTripActivitySheet } from "@/components/trips/trips-trip-activity-sheet";
import { TripsTripEditSheet } from "@/components/trips/trips-trip-edit-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectedSofChip } from "@/components/workspace/mother-lighter-picker";
import {
  invalidateMotherLighterPickerCaches,
  ML_VESSEL_PICKER_QUERY_ROOT,
  MotherLighterVesselPickerPanel
} from "@/components/workspace/mother-lighter-vessel-picker-panel";
import { useUserProfile } from "@/components/providers/auth-provider";
import { fetchLighterTrips, fetchLighterVesselsForPicker, patchLighterTrip } from "@/lib/lighter-trips-api";
import { parseApiErr } from "@/lib/parse-api-error";
import { canEditLighterTrips } from "@/lib/trips-permissions";
import { fetchVesselCall, fetchVesselCalls } from "@/lib/vessel-calls-api";
import { applySearchParams, vesselSofWorkspacePath } from "@/lib/workspace-paths";
import type { LighterTripListRow } from "@/types/vms";

/** Backend rejects any PATCH when trip status is `CLOSED`. */
function tripLocked(status: string): boolean {
  return status === "CLOSED";
}

function TripsWorkspaceInner() {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const kind: "mother" | "lighter" = searchParams.get("kind") === "lighter" ? "lighter" : "mother";
  const vesselCallId = searchParams.get("vesselCallId")?.trim() ?? "";
  const lighterCallId = searchParams.get("lighterCallId")?.trim() ?? "";
  const legacyLighterHullId = searchParams.get("lighterVesselId")?.trim() ?? "";
  const searchParamsSnapshot = searchParams.toString();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignMotherOpen, setAssignMotherOpen] = useState(false);
  const [editTripId, setEditTripId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [activityTripId, setActivityTripId] = useState<string | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const profile = useUserProfile();
  const canEdit = canEditLighterTrips(profile);

  const setKind = (next: "mother" | "lighter") => {
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

  const selectMother = (id: string) => {
    router.replace(
      applySearchParams(pathname, searchParams, {
        kind: "mother",
        vesselCallId: id,
        lighterCallId: null,
        lighterVesselId: null,
        id: null,
        pickSof: null
      }),
      { scroll: false }
    );
  };

  const selectLighterCall = (callId: string) => {
    router.replace(
      applySearchParams(pathname, searchParams, {
        kind: "lighter",
        lighterCallId: callId,
        lighterVesselId: null,
        vesselCallId: null,
        id: null,
        pickSof: null
      }),
      { scroll: false }
    );
  };

  /** Trips keeps only one selector id for current kind; drop stale SOF/workspace params from other pages. */
  useEffect(() => {
    const hasStaleId = searchParams.get("id");
    const hasStalePick = searchParams.get("pickSof");
    const hasCrossKind =
      (kind === "mother" && (!!lighterCallId || !!legacyLighterHullId)) ||
      (kind === "lighter" && !!vesselCallId);
    if (!hasStaleId && !hasStalePick && !hasCrossKind) return;
    router.replace(
      applySearchParams(pathname, searchParams, {
        id: null,
        pickSof: null,
        vesselCallId: kind === "mother" ? vesselCallId || null : null,
        lighterCallId: kind === "lighter" ? lighterCallId || null : null,
        lighterVesselId: kind === "lighter" ? legacyLighterHullId || null : null
      }),
      { scroll: false }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `searchParamsSnapshot` tracks URL; Next `searchParams` identity churn would retrigger redirects.
  }, [kind, vesselCallId, lighterCallId, legacyLighterHullId, pathname, router, searchParamsSnapshot]);

  /** Same pattern as vessel SOF `SelectedSofChip` — `Link` clears selection reliably under Suspense/Tabs. */
  const clearSelectionHref = useMemo(
    () =>
      applySearchParams(pathname, searchParams, {
        vesselCallId: null,
        lighterCallId: null,
        lighterVesselId: null,
        id: null,
        pickSof: null
      }),
    [pathname, searchParams]
  );

  const motherMetaQ = useQuery({
    queryKey: ["vessel-call-trips-meta", vesselCallId],
    queryFn: () => fetchVesselCall(vesselCallId),
    enabled: kind === "mother" && !!vesselCallId
  });

  const lighterCallMetaQ = useQuery({
    queryKey: ["trips-lighter-call-meta", lighterCallId],
    queryFn: () => fetchVesselCall(lighterCallId),
    enabled: kind === "lighter" && !!lighterCallId
  });

  const lighterHullIdResolved = lighterCallMetaQ.data?.vessel.id ?? "";

  const legacyLighterCallResolveQ = useQuery({
    queryKey: ["trips-legacy-lighter-hull-to-call", legacyLighterHullId],
    queryFn: () =>
      fetchVesselCalls({ hullKind: "lighter", vesselId: legacyLighterHullId, limit: 10 }),
    enabled: kind === "lighter" && !lighterCallId && !!legacyLighterHullId
  });

  useEffect(() => {
    if (kind !== "lighter" || lighterCallId || !legacyLighterHullId) return;
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
    legacyLighterCallResolveQ.isSuccess,
    legacyLighterCallResolveQ.isFetching,
    legacyLighterCallResolveQ.data,
    pathname,
    searchParamsSnapshot,
    router
  ]);

  const lighterMetaQ = useQuery({
    queryKey: ["lighter-hull-trips-meta", lighterHullIdResolved],
    queryFn: () =>
      fetchLighterVesselsForPicker({ id: lighterHullIdResolved, limit: 5 }).then((r) => r.data[0] ?? null),
    enabled: kind === "lighter" && !!lighterHullIdResolved
  });

  const tripsMotherQ = useQuery({
    queryKey: ["trips-by-vessel-call", vesselCallId],
    queryFn: () => fetchLighterTrips({ vesselCallId, limit: 80 }),
    enabled: kind === "mother" && !!vesselCallId
  });

  const tripsLighterQ = useQuery({
    queryKey: ["trips-by-lighter-hull", lighterHullIdResolved],
    queryFn: () => fetchLighterTrips({ lighterVesselId: lighterHullIdResolved, limit: 80 }),
    enabled: kind === "lighter" && !!lighterHullIdResolved
  });

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

  const invalidateForLighter: Array<readonly string[]> = lighterHullIdResolved
    ? [
        ["trips-by-lighter-hull", lighterHullIdResolved],
        ML_VESSEL_PICKER_QUERY_ROOT,
        ["lighter-hulls-picker"]
      ]
    : [];

  const invalidateForTripSheets: Array<readonly string[]> = [
    ...invalidateForMother,
    ...invalidateForLighter,
    ["lighter-hulls-picker"]
  ];
  const hasSelection = kind === "mother" ? !!vesselCallId : !!lighterCallId;
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
  const selectedLighterTitle =
    lighterCallMetaQ.data != null
      ? `${lighterCallMetaQ.data.callNo} · ${lighterCallMetaQ.data.vessel.name}`
      : lighterCallId
        ? "Lighter port call"
        : "";
  const selectedLighterDetails =
    lighterCallMetaQ.data != null
      ? `${lighterCallMetaQ.data.status}${
          lighterCallMetaQ.data.cargoNameSnapshot
            ? ` · ${lighterCallMetaQ.data.cargoNameSnapshot}`
            : ""
        }`
      : lighterCallId || "";
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
      await invalidateMotherLighterPickerCaches(qc);
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
          changeHref={clearSelectionHref}
        />
      ) : (
        <MotherLighterVesselPickerPanel
          kind={kind}
          vesselCallId={vesselCallId}
          lighterCallId={lighterCallId}
          search={search}
          debouncedSearch={debouncedSearch}
          onSearchChange={setSearch}
          onKindChange={(next) => {
            setSearch("");
            setKind(next);
          }}
          onSelectMother={(row) => selectMother(row.id)}
          onSelectLighter={(row) => selectLighterCall(row.id)}
          queriesEnabled={!hasSelection}
        />
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
      ) : kind === "lighter" && lighterCallId && lighterHullIdResolved ? (
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
                  Lighter <span className="font-medium text-foreground">{lighterMetaQ.data.name}</span>
                  {lighterMetaQ.data.imoNo ? ` · IMO ${lighterMetaQ.data.imoNo}` : ""}
                </p>
              ) : (
                <p className="text-sm text-destructive">Could not load this lighter vessel.</p>
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
              One lighter vessel can only have one unfinished trip at a time. When the trip is
              unloaded, closed, or cancelled, it can be assigned to another mother vessel from
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
                lighterCallId={lighterCallId}
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
        lighterVesselId={lighterHullIdResolved}
        lighterPortCallId={lighterCallId}
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
  lighterCallId,
  canEdit,
  onDelete,
  onEdit,
  onActivity
}: {
  rows: LighterTripListRow[];
  mode: "mother" | "lighter";
  /** When set (lighter tab with a port call selected), SOF deep links prefer `lighterCallId` over hull-only. */
  lighterCallId?: string;
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
          : "No trips found for this lighter (including completed trips in history)."}
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
                    href={vesselSofWorkspacePath("overview", "lighter", {
                      id: t.statementOfFacts.id,
                      ...(mode === "lighter" && lighterCallId
                        ? { lighterCallId }
                        : t.lighterPortCallId
                          ? { lighterCallId: t.lighterPortCallId }
                          : { lighterVesselId: t.lighterVessel.id })
                    })}
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
