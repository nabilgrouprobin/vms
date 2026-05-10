"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { MasterDataCardHeader } from "@/components/master-data/master-data-card-header";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import {
  CreateLighterVesselCallSheet,
  CreateMotherVesselCallSheet
} from "@/components/vessel-calls/create-mother-vessel-call-sheet";
import { invalidateMotherLighterPickerCaches } from "@/components/workspace/mother-lighter-vessel-picker-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useCursorBackedPagination } from "@/hooks/use-cursor-backed-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useUserProfile } from "@/components/providers/auth-provider";
import { formatDt } from "@/lib/format";
import { parseApiErr } from "@/lib/parse-api-error";
import { toast } from "@/lib/toast";
import { canCreateVesselCalls } from "@/lib/vessel-call-permissions";
import { deleteVesselCall, fetchVesselCalls, patchVesselCall } from "@/lib/vessel-calls-api";
import type { Paginated, VesselCallListRow } from "@/types/vms";
import { MOTHER_VESSEL_STATUSES } from "@/types/vms";

function isoToDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function VesselCallsCrudPage() {
  const qc = useQueryClient();
  const profile = useUserProfile();
  const canEdit = canCreateVesselCalls(profile);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [portTab, setPortTab] = useState<"mother" | "lighter">("mother");
  const [createMotherOpen, setCreateMotherOpen] = useState(false);
  const [createLighterOpen, setCreateLighterOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<VesselCallListRow | null>(null);
  const [callNo, setCallNo] = useState("");
  const [etaLocal, setEtaLocal] = useState("");
  const [cargo, setCargo] = useState("");
  const [status, setStatus] = useState<string>("EXPECTED");
  const [formError, setFormError] = useState<string | null>(null);

  const listQ = useInfiniteQuery({
    queryKey: ["vessel-calls-crud", portTab, debouncedSearch, statusFilter],
    initialPageParam: undefined as string | undefined,
    staleTime: 20_000,
    queryFn: ({ pageParam }) =>
      fetchVesselCalls({
        limit: 30,
        cursor: pageParam,
        search: debouncedSearch || undefined,
        hullKind: portTab,
        ...(statusFilter ? { status: statusFilter } : {})
      }),
    getNextPageParam: (last: Paginated<VesselCallListRow>) => last.nextCursor ?? undefined
  });

  const rows = useMemo(() => listQ.data?.pages.flatMap((p) => p.data) ?? [], [listQ.data]);

  const listResetKey = useMemo(
    () => `${portTab}\u0000${debouncedSearch}\u0000${statusFilter}`,
    [portTab, debouncedSearch, statusFilter]
  );

  const pager = useCursorBackedPagination({
    items: rows,
    hasNextPage: Boolean(listQ.hasNextPage),
    fetchNextPage: () => void listQ.fetchNextPage(),
    isFetchingNextPage: listQ.isFetchingNextPage,
    resetKey: listResetKey
  });

  useEffect(() => {
    if (!editOpen) {
      setEditing(null);
      setFormError(null);
      setCallNo("");
      setEtaLocal("");
      setCargo("");
      setStatus("EXPECTED");
    }
  }, [editOpen]);

  const openEdit = (row: VesselCallListRow) => {
    setEditing(row);
    setCallNo(row.callNo);
    setEtaLocal(isoToDatetimeLocalValue(row.eta));
    setCargo(row.cargoNameSnapshot ?? "");
    setStatus(row.status);
    setFormError(null);
    setEditOpen(true);
  };

  const patchM = useMutation({
    mutationFn: async () => {
      if (!editing) throw new Error("No row");
      const etaPayload =
        etaLocal.trim() === "" ? null : new Date(etaLocal.trim()).toISOString();
      return patchVesselCall(editing.id, {
        callNo: callNo.trim(),
        cargoNameSnapshot: cargo.trim() || null,
        eta: etaPayload,
        status
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["vessel-calls-crud"] });
      await invalidateMotherLighterPickerCaches(qc);
      await qc.invalidateQueries({ queryKey: ["sof-options"] });
      setEditOpen(false);
    },
    onError: (e: unknown) => setFormError(parseApiErr(e))
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteVesselCall(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["vessel-calls-crud"] });
      await invalidateMotherLighterPickerCaches(qc);
      await qc.invalidateQueries({ queryKey: ["sof-options"] });
    }
  });

  const etaParseOk = !etaLocal.trim() || !Number.isNaN(new Date(etaLocal.trim()).getTime());
  const canSaveEdit =
    !!editing && callNo.trim().length >= 2 && etaParseOk && !patchM.isPending;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Card>
        <MasterDataCardHeader
          title="Vessel calls"
          description={
            portTab === "mother" ? (
              <>
                Mother vessel port visits. Register hulls under{" "}
                <Link href="/master-data/mother-vessels" className="underline">
                  Master data → Mother vessels
                </Link>
                , then create calls here. Trips and SOF pick mother calls from operational screens.
              </>
            ) : (
              <>
                Lighter port visits (per hull). Register hulls under{" "}
                <Link href="/master-data/lighters" className="underline">
                  Master data → Lighters
                </Link>
                , then create calls here. The lighter tab in Trips / SOF picks these calls.
              </>
            )
          }
          actions={
            canEdit ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={portTab === "mother" ? "default" : "secondary"}
                  onClick={() => setPortTab("mother")}
                >
                  Mother calls
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={portTab === "lighter" ? "default" : "secondary"}
                  onClick={() => setPortTab("lighter")}
                >
                  Lighter calls
                </Button>
                {portTab === "mother" ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => setCreateMotherOpen(true)}>
                    New mother call
                  </Button>
                ) : (
                  <Button type="button" size="sm" variant="outline" onClick={() => setCreateLighterOpen(true)}>
                    New lighter call
                  </Button>
                )}
              </div>
            ) : null
          }
        />
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[12rem] flex-1 space-y-2">
              <Label htmlFor="vc-search">Search</Label>
              <Input
                id="vc-search"
                placeholder="Call no., vessel, cargo…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full min-w-[10rem] space-y-2 sm:w-48">
              <Label htmlFor="vc-status">Status</Label>
              <select
                id="vc-status"
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                {MOTHER_VESSEL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border border-border">
            {listQ.isLoading ? (
              <div className="p-4">
                <Skeleton className="h-40 w-full" />
              </div>
            ) : listQ.isError ? (
              <p className="p-4 text-sm text-destructive">{parseApiErr(listQ.error)}</p>
            ) : pager.pageItems.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No vessel calls match. Adjust search or create a new call.
              </p>
            ) : (
              <table className="w-full min-w-[52rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2">Call no.</th>
                    <th className="px-3 py-2">Vessel</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">ETA</th>
                    <th className="px-3 py-2">SOF</th>
                    {portTab === "mother" ? (
                      <>
                        <th className="px-3 py-2 text-right">Trips</th>
                        <th className="px-3 py-2 text-right">Alloc.</th>
                      </>
                    ) : null}
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pager.pageItems.map((row) => (
                    <tr key={row.id} className="border-b border-border/80 last:border-0">
                      <td className="px-3 py-2 font-medium">{row.callNo}</td>
                      <td className="px-3 py-2">
                        <div>{row.vessel.name}</div>
                        {row.vessel.imoNo ? (
                          <div className="text-xs text-muted-foreground">IMO {row.vessel.imoNo}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="font-normal">
                          {row.status.replaceAll("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{formatDt(row.eta)}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.statementOfFacts ? row.statementOfFacts.sofNo : "—"}
                      </td>
                      {portTab === "mother" ? (
                        <>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {row._count.lighterTrips}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {row._count.lighterAssignments}
                          </td>
                        </>
                      ) : null}
                      <td className="px-3 py-2 text-right">
                        {canEdit ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(row)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              disabled={deleteM.isPending}
                              onClick={() => {
                                const ok = window.confirm(
                                  `Delete vessel call ${row.callNo}? This cannot be undone if the system allows removal.`
                                );
                                if (!ok) return;
                                setFormError(null);
                                deleteM.mutate(row.id, {
                                  onError: (e) => toast.error(parseApiErr(e))
                                });
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!listQ.isLoading && !listQ.isError && rows.length > 0 ? (
            <PaginationBar
              pageIndex={pager.pageIndex}
              pageSize={pager.pageSize}
              pageSizeOptions={pager.pageSizeOptions}
              onPageSizeChange={pager.setPageSize}
              canPrev={pager.canGoPrev}
              canNext={pager.canGoNext}
              onPrev={pager.goPrev}
              onNext={pager.goNext}
              summary={pager.rangeLabel}
              isBusy={listQ.isFetchingNextPage}
            />
          ) : null}
        </CardContent>
      </Card>

      <CreateMotherVesselCallSheet
        open={createMotherOpen}
        onOpenChange={setCreateMotherOpen}
        canEdit={canEdit}
        onCreated={async () => {
          await qc.invalidateQueries({ queryKey: ["vessel-calls-crud"] });
        }}
      />
      <CreateLighterVesselCallSheet
        open={createLighterOpen}
        onOpenChange={setCreateLighterOpen}
        canEdit={canEdit}
        onCreated={async () => {
          await qc.invalidateQueries({ queryKey: ["vessel-calls-crud"] });
        }}
      />

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
          <SheetTitle>Edit vessel call</SheetTitle>
          <SheetDescription>
            {editing ? (
              <>
                Hull <span className="font-medium text-foreground">{editing.vessel.name}</span> is
                fixed for this row; change registry under Master data if the wrong vessel was chosen
                at creation.
              </>
            ) : null}
          </SheetDescription>

          {editing ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1 pt-2">
              <div className="space-y-2">
                <Label htmlFor="edit-call-no">Call number</Label>
                <Input
                  id="edit-call-no"
                  value={callNo}
                  onChange={(e) => setCallNo(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {MOTHER_VESSEL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-eta">ETA</Label>
                <Input
                  id="edit-eta"
                  type="datetime-local"
                  value={etaLocal}
                  onChange={(e) => setEtaLocal(e.target.value)}
                />
                {!etaParseOk ? (
                  <p className="text-xs text-destructive">Enter a valid date and time.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Clear the field to remove ETA.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cargo">Cargo snapshot</Label>
                <Input
                  id="edit-cargo"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
              <div className="mt-auto flex flex-wrap gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!canSaveEdit}
                  onClick={() => {
                    setFormError(null);
                    if (etaLocal.trim() !== "" && Number.isNaN(new Date(etaLocal.trim()).getTime())) {
                      setFormError("ETA must be a valid date and time.");
                      return;
                    }
                    patchM.mutate();
                  }}
                >
                  {patchM.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
