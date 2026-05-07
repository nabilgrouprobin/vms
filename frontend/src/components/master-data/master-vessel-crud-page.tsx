"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  createMasterVessel,
  fetchMasterVessels,
  patchMasterVessel,
  softDeleteMasterVessel
} from "@/lib/master-data-api";
import { exportVesselsCsv, formatCsvImportSummary, importVesselsCsv } from "@/lib/master-data-csv-bridge";
import { canEditMasterData } from "@/lib/master-data-permissions";
import { parseApiErr } from "@/lib/parse-api-error";
import type { MasterVesselKind, MasterVesselRow, Paginated } from "@/types/vms";

type Props = {
  kind: MasterVesselKind;
  title: string;
  description: string;
};

function usageLabel(row: MasterVesselRow): string {
  if ("motherCalls" in row._count) {
    return `${row._count.motherCalls} call(s)`;
  }
  return `${row._count.lighterTrips} trip(s)`;
}

function optNum(s: string, label: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = parseFloat(t);
  if (!Number.isFinite(n)) {
    throw new Error(`${label} must be a valid number.`);
  }
  return n;
}

function optInt(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = parseInt(t, 10);
  if (!Number.isFinite(n)) {
    throw new Error("Year built must be a whole number.");
  }
  return n;
}

export function MasterVesselCrudPage({ kind, title, description }: Props) {
  const qc = useQueryClient();
  const profile = useMemo(() => getUserProfile(), []);
  const canEdit = canEditMasterData(profile);
  const fileRef = useRef<HTMLInputElement>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [includeInactive, setIncludeInactive] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<MasterVesselRow | null>(null);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [imoNo, setImoNo] = useState("");
  const [flag, setFlag] = useState("");
  const [vesselType, setVesselType] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [deadweightTon, setDeadweightTon] = useState("");
  const [maxDraftMeters, setMaxDraftMeters] = useState("");
  const [lengthOverallM, setLengthOverallM] = useState("");
  const [beamM, setBeamM] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!sheetOpen) {
      setFormError(null);
    }
  }, [sheetOpen]);

  const listQ = useInfiniteQuery({
    queryKey: ["master-vessels", kind, debouncedSearch, includeInactive],
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
    queryFn: async ({ pageParam }) =>
      fetchMasterVessels(kind, {
        limit: 24,
        cursor: pageParam,
        search: debouncedSearch || undefined,
        includeInactive
      }),
    getNextPageParam: (last: Paginated<MasterVesselRow>) => last.nextCursor ?? undefined
  });

  const rows = useMemo(
    () => listQ.data?.pages.flatMap((p) => p.data) ?? [],
    [listQ.data]
  );

  const listResetKey = useMemo(
    () => `${kind}\u0000${debouncedSearch}\u0000${includeInactive ? "1" : "0"}`,
    [kind, debouncedSearch, includeInactive]
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
    setImoNo("");
    setFlag("");
    setVesselType("");
    setYearBuilt("");
    setDeadweightTon("");
    setMaxDraftMeters("");
    setLengthOverallM("");
    setBeamM("");
    setIsActive(true);
    setSheetOpen(true);
  };

  const openDetails = (row: MasterVesselRow) => {
    setCreating(false);
    setEditing(row);
    setName(row.name);
    setImoNo(row.imoNo ?? "");
    setFlag(row.flag ?? "");
    setVesselType(row.vesselType ?? "");
    setYearBuilt(row.yearBuilt != null ? String(row.yearBuilt) : "");
    setDeadweightTon(row.deadweightTon ?? "");
    setMaxDraftMeters(row.maxDraftMeters ?? "");
    setLengthOverallM(row.lengthOverallM ?? "");
    setBeamM(row.beamM ?? "");
    setIsActive(row.isActive);
    setSheetOpen(true);
  };

  const buildWriteBody = () => {
    const yb = yearBuilt.trim() ? optInt(yearBuilt) : null;
    if (yearBuilt.trim() && yb === null) {
      throw new Error("Year built must be a whole number.");
    }
    return {
      name: name.trim(),
      imoNo: imoNo.trim() || null,
      flag: flag.trim() || null,
      vesselType: vesselType.trim() || null,
      yearBuilt: yb,
      deadweightTon: optNum(deadweightTon, "Deadweight (MT)"),
      maxDraftMeters: optNum(maxDraftMeters, "Max draft (m)"),
      lengthOverallM: optNum(lengthOverallM, "Length overall (m)"),
      beamM: optNum(beamM, "Beam (m)")
    };
  };

  const saveM = useMutation({
    mutationFn: async () => {
      const body = buildWriteBody();
      if (creating) {
        return createMasterVessel(kind, body);
      }
      if (!editing) throw new Error("Nothing to save.");
      return patchMasterVessel(kind, editing.id, {
        ...body,
        isActive
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["master-vessels", kind] });
      setSheetOpen(false);
    },
    onError: (e: unknown) => {
      setFormError(parseApiErr(e));
    }
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => softDeleteMasterVessel(kind, id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["master-vessels", kind] });
    }
  });

  const restoreM = useMutation({
    mutationFn: async (id: string) => patchMasterVessel(kind, id, { isActive: true }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["master-vessels", kind] });
    }
  });

  const onDelete = (row: MasterVesselRow) => {
    const msg = `Delete “${row.name}”? This deactivates the hull (hidden from pickers); existing calls and trips stay linked.`;
    if (!window.confirm(msg)) return;
    deleteM.mutate(row.id, {
      onError: (e) => window.alert(parseApiErr(e))
    });
  };

  const onRestore = (row: MasterVesselRow) => {
    if (!window.confirm(`Restore “${row.name}” as active?`)) return;
    restoreM.mutate(row.id, {
      onError: (e) => window.alert(parseApiErr(e))
    });
  };

  const readOnly = !canEdit;

  const onExportCsv = async () => {
    setExportBusy(true);
    try {
      await exportVesselsCsv(kind, {
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
      const summary = await importVesselsCsv(kind, text);
      await qc.invalidateQueries({ queryKey: ["master-vessels", kind] });
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
        title={title}
        description={description}
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
                <Button type="button" size="sm" onClick={openCreate}>
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
            Use <strong>Edit</strong> to view the full registry record. Export CSV is available to everyone. Import and
            delete require a master-data editor role.
          </p>
        ) : null}
        <MasterDataSearchFilters
          idPrefix={kind === "mother" ? "mv" : "lv"}
          search={search}
          onSearchChange={setSearch}
          placeholder="Name or IMO…"
          includeInactive={includeInactive}
          onIncludeInactiveChange={setIncludeInactive}
          inactiveLabel="Show inactive"
        />

        {listQ.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : listQ.isError ? (
          <p className="text-sm text-destructive">{parseApiErr(listQ.error)}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No vessels match your filters.</p>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">IMO</th>
                  <th className="px-3 py-2 font-medium">DWT (MT)</th>
                  <th className="px-3 py-2 font-medium">Usage</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 min-w-[9rem] font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pager.pageItems.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-medium text-foreground">{row.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.imoNo ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.deadweightTon ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{usageLabel(row)}</td>
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
                            onClick={() => onDelete(row)}
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
                            onClick={() => onRestore(row)}
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
          <SheetTitle>{creating ? "Add vessel" : "Vessel details"}</SheetTitle>
          <SheetDescription>
            {readOnly
              ? "Read-only view of the registry. Ask an administrator to change data."
              : creating
                ? "Create a hull. Name must be unique across all vessels. Fill dimensions and tonnage as needed for operations and reporting."
                : "Edit all fields below. Delete deactivates the hull (pickers hide it)."}
          </SheetDescription>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1 pt-4">
              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
              <div className="space-y-2">
                <Label htmlFor="md-name">Name</Label>
                <Input
                  id="md-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Vessel name"
                  disabled={readOnly}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="md-imo">IMO number</Label>
                  <Input id="md-imo" value={imoNo} onChange={(e) => setImoNo(e.target.value)} disabled={readOnly} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="md-flag">Flag</Label>
                  <Input id="md-flag" value={flag} onChange={(e) => setFlag(e.target.value)} disabled={readOnly} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="md-vt">Vessel type</Label>
                <Input
                  id="md-vt"
                  value={vesselType}
                  onChange={(e) => setVesselType(e.target.value)}
                  disabled={readOnly}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="md-yb">Year built</Label>
                  <Input
                    id="md-yb"
                    inputMode="numeric"
                    value={yearBuilt}
                    onChange={(e) => setYearBuilt(e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="md-dwt">Deadweight (MT)</Label>
                  <Input
                    id="md-dwt"
                    inputMode="decimal"
                    value={deadweightTon}
                    onChange={(e) => setDeadweightTon(e.target.value)}
                    disabled={readOnly}
                  />
                </div>
              </div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dimensions</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="md-loa">Length overall (m)</Label>
                  <Input
                    id="md-loa"
                    inputMode="decimal"
                    value={lengthOverallM}
                    onChange={(e) => setLengthOverallM(e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="md-beam">Beam (m)</Label>
                  <Input
                    id="md-beam"
                    inputMode="decimal"
                    value={beamM}
                    onChange={(e) => setBeamM(e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="md-draft">Max draft (m)</Label>
                  <Input
                    id="md-draft"
                    inputMode="decimal"
                    value={maxDraftMeters}
                    onChange={(e) => setMaxDraftMeters(e.target.value)}
                    disabled={readOnly}
                  />
                </div>
              </div>
              {!creating ? (
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    disabled={readOnly}
                    className="size-4 rounded border border-input"
                  />
                  Active (shown in pickers)
                </label>
              ) : null}
              {!readOnly ? (
                <div className="mt-auto flex gap-2 border-t border-border pt-4">
                  <Button
                    type="button"
                    className="flex-1"
                    disabled={!name.trim() || saveM.isPending}
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
