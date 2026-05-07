"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { MasterDataCardHeader } from "@/components/master-data/master-data-card-header";
import { MasterDataSearchFilters } from "@/components/master-data/master-data-search-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { MasterDataCsvToolbar } from "@/components/data-table/master-data-csv-toolbar";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { useCursorBackedPagination } from "@/hooks/use-cursor-backed-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getUserProfile } from "@/lib/auth-storage";
import {
  createMasterGhat,
  fetchLocationOptions,
  fetchMasterGhats,
  patchMasterGhat,
  softDeleteMasterGhat
} from "@/lib/master-data-api";
import {
  exportGhatsCsv,
  formatCsvImportSummary,
  importGhatsCsv
} from "@/lib/master-data-csv-bridge";
import { canEditMasterData } from "@/lib/master-data-permissions";
import { parseApiErr } from "@/lib/parse-api-error";
import type { MasterGhatRow, Paginated } from "@/types/vms";

function optNum(s: string, label: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = parseFloat(t);
  if (!Number.isFinite(n)) {
    throw new Error(`${label} must be a valid number.`);
  }
  return n;
}

export function MasterGhatsCrudPage() {
  const qc = useQueryClient();
  const profile = useMemo(() => getUserProfile(), []);
  const canEdit = canEditMasterData(profile);
  const readOnly = !canEdit;
  const fileRef = useRef<HTMLInputElement>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);

  const locQ = useQuery({
    queryKey: ["location-options"],
    queryFn: fetchLocationOptions,
    staleTime: 60_000
  });

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<MasterGhatRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState("");
  const [numberOfJetties, setNumberOfJetties] = useState("1");
  const [unloadingCapacityMtPerDay, setUnloadingCapacityMtPerDay] = useState("");
  const [warehouseCapacityMt, setWarehouseCapacityMt] = useState("");
  const [hasWarehouseStorage, setHasWarehouseStorage] = useState(false);
  const [hasTruckScale, setHasTruckScale] = useState(false);
  const [workingStartHour, setWorkingStartHour] = useState("");
  const [workingEndHour, setWorkingEndHour] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!sheetOpen) setFormError(null);
  }, [sheetOpen]);

  const listQ = useInfiniteQuery({
    queryKey: ["master-ghats", debouncedSearch, includeInactive],
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
    queryFn: async ({ pageParam }) =>
      fetchMasterGhats({
        limit: 24,
        cursor: pageParam,
        search: debouncedSearch || undefined,
        includeInactive
      }),
    getNextPageParam: (last: Paginated<MasterGhatRow>) => last.nextCursor ?? undefined
  });

  const rows = useMemo(
    () => listQ.data?.pages.flatMap((p) => p.data) ?? [],
    [listQ.data]
  );

  const listResetKey = useMemo(
    () => `${debouncedSearch}\u0000${includeInactive ? "1" : "0"}`,
    [debouncedSearch, includeInactive]
  );

  const pager = useCursorBackedPagination({
    items: rows,
    hasNextPage: Boolean(listQ.hasNextPage),
    fetchNextPage: () => void listQ.fetchNextPage(),
    isFetchingNextPage: listQ.isFetchingNextPage,
    resetKey: listResetKey
  });

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setName("");
    setLocationId(locQ.data?.[0]?.id ?? "");
    setNumberOfJetties("1");
    setUnloadingCapacityMtPerDay("");
    setWarehouseCapacityMt("");
    setHasWarehouseStorage(false);
    setHasTruckScale(false);
    setWorkingStartHour("");
    setWorkingEndHour("");
    setContactPerson("");
    setContactNo("");
    setIsActive(true);
    setSheetOpen(true);
  };

  const openDetails = (row: MasterGhatRow) => {
    setCreating(false);
    setEditing(row);
    setName(row.name);
    setLocationId(row.locationId);
    setNumberOfJetties(String(row.numberOfJetties ?? 1));
    setUnloadingCapacityMtPerDay(row.unloadingCapacityMtPerDay ?? "");
    setWarehouseCapacityMt(row.warehouseCapacityMt ?? "");
    setHasWarehouseStorage(row.hasWarehouseStorage);
    setHasTruckScale(row.hasTruckScale);
    setWorkingStartHour(row.workingStartHour ?? "");
    setWorkingEndHour(row.workingEndHour ?? "");
    setContactPerson(row.contactPerson ?? "");
    setContactNo(row.contactNo ?? "");
    setIsActive(row.isActive);
    setSheetOpen(true);
  };

  const saveM = useMutation({
    mutationFn: async () => {
      const nj = parseInt(numberOfJetties, 10);
      if (!Number.isFinite(nj) || nj < 1) {
        throw new Error("Number of jetties must be at least 1.");
      }
      const common = {
        name: name.trim(),
        locationId,
        numberOfJetties: nj,
        hasWarehouseStorage,
        hasTruckScale,
        workingStartHour: workingStartHour.trim() || null,
        workingEndHour: workingEndHour.trim() || null,
        contactPerson: contactPerson.trim() || null,
        contactNo: contactNo.trim() || null,
        unloadingCapacityMtPerDay: optNum(unloadingCapacityMtPerDay, "Unloading capacity (MT/day)"),
        warehouseCapacityMt: optNum(warehouseCapacityMt, "Warehouse capacity (MT)")
      };
      if (creating) {
        return createMasterGhat(common);
      }
      if (!editing) throw new Error("Nothing to save.");
      return patchMasterGhat(editing.id, { ...common, isActive });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["master-ghats"] });
      setSheetOpen(false);
    },
    onError: (e: unknown) => setFormError(parseApiErr(e))
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => softDeleteMasterGhat(id),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["master-ghats"] })
  });

  const restoreM = useMutation({
    mutationFn: (id: string) => patchMasterGhat(id, { isActive: true }),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["master-ghats"] })
  });

  const onExportCsv = async () => {
    setExportBusy(true);
    try {
      await exportGhatsCsv({
        search: debouncedSearch || undefined,
        includeInactive
      });
    } catch (e) {
      window.alert(parseApiErr(e));
    } finally {
      setExportBusy(false);
    }
  };

  const onImportCsv: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canEdit) return;
    setImportBusy(true);
    try {
      const text = await file.text();
      const summary = await importGhatsCsv(text);
      await qc.invalidateQueries({ queryKey: ["master-ghats"] });
      window.alert(formatCsvImportSummary("Import finished.", summary));
    } catch (err) {
      window.alert(parseApiErr(err));
    } finally {
      setImportBusy(false);
    }
  };

  return (
    <Card>
      <MasterDataCardHeader
        title="Ghats"
        description="Discharge ghats linked to a parent location (used in lighter assignments)."
        actions={
          <MasterDataCsvToolbar
            fileInputRef={fileRef}
            onExport={() => void onExportCsv()}
            exportBusy={exportBusy}
            importBusy={importBusy}
            canImport={canEdit}
            onImportFileChange={onImportCsv}
            extra={
              canEdit ? (
                <Button type="button" size="sm" onClick={openCreate} disabled={!locQ.data?.length}>
                  Add new
                </Button>
              ) : null
            }
          />
        }
      />
      <CardContent className="space-y-4">
        {!canEdit ? (
          <p className="text-sm text-muted-foreground">
            Use <strong>Edit</strong> to view a ghat. Export CSV for everyone; import and delete for editors.
          </p>
        ) : null}
        {locQ.isError ? (
          <p className="text-sm text-destructive">Could not load locations: {parseApiErr(locQ.error)}</p>
        ) : null}
        <MasterDataSearchFilters
          idPrefix="g"
          search={search}
          onSearchChange={setSearch}
          placeholder="Code or name…"
          includeInactive={includeInactive}
          onIncludeInactiveChange={setIncludeInactive}
          inactiveLabel="Show inactive"
        />

        {listQ.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : listQ.isError ? (
          <p className="text-sm text-destructive">{parseApiErr(listQ.error)}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No ghats match your filters.</p>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Code</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Location</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="min-w-[9rem] px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pager.pageItems.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">{row.code}</td>
                    <td className="px-3 py-2 font-medium">{row.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.location.name} ({row.location.code})
                    </td>
                    <td className="px-3 py-2">
                      {row.isActive ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openDetails(row)}>
                          {readOnly ? "View" : "Edit"}
                        </Button>
                        {canEdit && row.isActive ? (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={deleteM.isPending}
                            onClick={() => {
                              if (!window.confirm(`Delete (deactivate) ghat “${row.name}”?`)) return;
                              deleteM.mutate(row.id, {
                                onError: (e) => window.alert(parseApiErr(e))
                              });
                            }}
                          >
                            Delete
                          </Button>
                        ) : null}
                        {canEdit && !row.isActive ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={restoreM.isPending}
                            onClick={() => {
                              if (!window.confirm(`Restore ghat “${row.name}”?`)) return;
                              restoreM.mutate(row.id, {
                                onError: (e) => window.alert(parseApiErr(e))
                              });
                            }}
                          >
                            Restore
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
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
              isBusy={pager.isPrefetching}
            />
          </div>
        )}
      </CardContent>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
          <SheetTitle>{creating ? "Add ghat" : "Ghat details"}</SheetTitle>
          <SheetDescription>
            {readOnly ? "Read-only." : "Ghat code is assigned automatically. Pick a location, then set capacities and contacts as needed."}
          </SheetDescription>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1 pt-4">
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            {locQ.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {!creating && editing ? (
                    <div className="space-y-2">
                      <Label htmlFor="g-code-ro">Code</Label>
                      <Input
                        id="g-code-ro"
                        readOnly
                        disabled
                        className="font-mono text-xs"
                        value={editing.code}
                      />
                    </div>
                  ) : null}
                  <div className={`space-y-2 ${creating ? "sm:col-span-2" : ""}`}>
                    <Label htmlFor="g-loc">Location</Label>
                    <select
                      id="g-loc"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm disabled:opacity-50"
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                      disabled={readOnly}
                    >
                      {(locQ.data ?? []).map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="g-name">Name</Label>
                  <Input id="g-name" value={name} onChange={(e) => setName(e.target.value)} disabled={readOnly} />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="g-jet">Jetties</Label>
                    <Input
                      id="g-jet"
                      inputMode="numeric"
                      value={numberOfJetties}
                      onChange={(e) => setNumberOfJetties(e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="g-unl">Unload cap. (MT/day)</Label>
                    <Input
                      id="g-unl"
                      inputMode="decimal"
                      value={unloadingCapacityMtPerDay}
                      onChange={(e) => setUnloadingCapacityMtPerDay(e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="g-wh">Warehouse cap. (MT)</Label>
                    <Input
                      id="g-wh"
                      inputMode="decimal"
                      value={warehouseCapacityMt}
                      onChange={(e) => setWarehouseCapacityMt(e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={hasWarehouseStorage}
                      onChange={(e) => setHasWarehouseStorage(e.target.checked)}
                      disabled={readOnly}
                      className="size-4 rounded border border-input"
                    />
                    Warehouse storage
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={hasTruckScale}
                      onChange={(e) => setHasTruckScale(e.target.checked)}
                      disabled={readOnly}
                      className="size-4 rounded border border-input"
                    />
                    Truck scale
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="g-ws">Working start (e.g. 08:00)</Label>
                    <Input
                      id="g-ws"
                      value={workingStartHour}
                      onChange={(e) => setWorkingStartHour(e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="g-we">Working end</Label>
                    <Input
                      id="g-we"
                      value={workingEndHour}
                      onChange={(e) => setWorkingEndHour(e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="g-cp">Contact person</Label>
                    <Input
                      id="g-cp"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="g-cn">Contact no.</Label>
                    <Input id="g-cn" value={contactNo} onChange={(e) => setContactNo(e.target.value)} disabled={readOnly} />
                  </div>
                </div>
                {!creating ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      disabled={readOnly}
                      className="size-4 rounded border border-input"
                    />
                    Active
                  </label>
                ) : null}
              </>
            )}
            {!readOnly ? (
              <div className="mt-auto flex gap-2 border-t border-border pt-4">
                <Button
                  type="button"
                  className="flex-1"
                  disabled={!name.trim() || !locationId || saveM.isPending}
                  onClick={() => {
                    setFormError(null);
                    saveM.mutate();
                  }}
                >
                  {saveM.isPending ? "Saving…" : "Save"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                  Close
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" className="mt-auto" onClick={() => setSheetOpen(false)}>
                Close
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
