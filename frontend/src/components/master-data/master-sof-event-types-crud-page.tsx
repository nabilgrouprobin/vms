"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { MasterDataCsvToolbar } from "@/components/data-table/master-data-csv-toolbar";
import { MasterDataCardHeader } from "@/components/master-data/master-data-card-header";
import { MasterDataSearchFilters } from "@/components/master-data/master-data-search-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { useCursorBackedPagination } from "@/hooks/use-cursor-backed-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getUserProfile } from "@/lib/auth-storage";
import {
  createMasterSofEventType,
  fetchMasterSofEventTypes,
  patchMasterSofEventType,
  softDeleteMasterSofEventType
} from "@/lib/master-data-api";
import {
  exportSofEventTypesCsv,
  formatCsvImportSummary,
  importSofEventTypesCsv
} from "@/lib/master-data-csv-bridge";
import { canEditMasterData } from "@/lib/master-data-permissions";
import { parseApiErr } from "@/lib/parse-api-error";
import { cn } from "@/lib/utils";
import {
  SOF_EVENT_TYPE_CATEGORIES,
  SOF_EVENT_TYPE_SCOPES,
  type MasterSofEventTypeRow,
  type Paginated,
  type SofEventTypeCategoryUi
} from "@/types/vms";

type SofAdminScopeTab = "ALL" | "MOTHER_VESSEL" | "LIGHTER_VESSEL" | "BOTH";

export function MasterSofEventTypesCrudPage() {
  const qc = useQueryClient();
  const profile = useMemo(() => getUserProfile(), []);
  const canEdit = canEditMasterData(profile);
  const readOnly = !canEdit;
  const fileRef = useRef<HTMLInputElement>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [scopeTab, setScopeTab] = useState<SofAdminScopeTab>("ALL");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<MasterSofEventTypeRow | null>(null);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [scope, setScope] = useState<string>("BOTH");
  const [category, setCategory] = useState<SofEventTypeCategoryUi>("NORMAL");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!sheetOpen) setFormError(null);
  }, [sheetOpen]);

  const listQ = useInfiniteQuery({
    queryKey: ["master-sof-event-types", debouncedSearch, includeInactive, scopeTab],
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
    queryFn: async ({ pageParam }) =>
      fetchMasterSofEventTypes({
        limit: 24,
        cursor: pageParam,
        search: debouncedSearch || undefined,
        includeInactive,
        scope: scopeTab
      }),
    getNextPageParam: (last: Paginated<MasterSofEventTypeRow>) => last.nextCursor ?? undefined
  });

  const rows = useMemo(
    () => listQ.data?.pages.flatMap((p) => p.data) ?? [],
    [listQ.data]
  );

  const listResetKey = useMemo(
    () => `${debouncedSearch}\u0000${includeInactive ? "1" : "0"}\u0000${scopeTab}`,
    [debouncedSearch, includeInactive, scopeTab]
  );

  const pager = useCursorBackedPagination({
    items: rows,
    hasNextPage: Boolean(listQ.hasNextPage),
    fetchNextPage: () => void listQ.fetchNextPage(),
    isFetchingNextPage: listQ.isFetchingNextPage,
    resetKey: listResetKey
  });

  const invalidatePickers = async () => {
    await qc.invalidateQueries({ queryKey: ["sof-event-type-options"] });
    await qc.invalidateQueries({ queryKey: ["master-sof-event-types"] });
  };

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setName("");
    setScope(scopeTab === "ALL" ? "BOTH" : scopeTab);
    setCategory("NORMAL");
    setIsActive(true);
    setSheetOpen(true);
  };

  const openDetails = (row: MasterSofEventTypeRow) => {
    setCreating(false);
    setEditing(row);
    setName(row.name);
    setScope(row.scope);
    setCategory(row.category ?? "NORMAL");
    setIsActive(row.isActive);
    setSheetOpen(true);
  };

  const saveM = useMutation({
    mutationFn: async () => {
      if (creating) {
        return createMasterSofEventType({
          name: name.trim(),
          scope,
          category
        });
      }
      if (!editing) throw new Error("Nothing to save.");
      return patchMasterSofEventType(editing.id, {
        name: name.trim(),
        scope,
        category,
        isActive
      });
    },
    onSuccess: async (updated) => {
      await invalidatePickers();
      await qc.refetchQueries({ queryKey: ["master-sof-event-types"] });
      if (updated && typeof updated === "object" && "id" in updated) {
        setEditing((prev) => (prev?.id === (updated as MasterSofEventTypeRow).id ? (updated as MasterSofEventTypeRow) : prev));
      }
      setSheetOpen(false);
    },
    onError: (e: unknown) => setFormError(parseApiErr(e))
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => softDeleteMasterSofEventType(id),
    onSuccess: async () => {
      await invalidatePickers();
    }
  });

  const restoreM = useMutation({
    mutationFn: (row: MasterSofEventTypeRow) => patchMasterSofEventType(row.id, { isActive: true }),
    onSuccess: async (updated) => {
      await invalidatePickers();
      setEditing((prev) => (prev?.id === updated.id ? updated : prev));
    }
  });

  const fmtScope = (s: string) => s.replace(/_/g, " ");
  const fmtCategory = (c: SofEventTypeCategoryUi) =>
    c === "HOLD_DELAY" ? "Hold / delay" : "Normal";

  const scopeTabs: { id: SofAdminScopeTab; label: string }[] = [
    { id: "ALL", label: "All" },
    { id: "MOTHER_VESSEL", label: "Mother vessel" },
    { id: "LIGHTER_VESSEL", label: "Lighter vessel" },
    { id: "BOTH", label: "Shared" }
  ];

  const onExportCsv = async () => {
    setExportBusy(true);
    try {
      await exportSofEventTypesCsv({
        search: debouncedSearch,
        includeInactive,
        scope: scopeTab
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
      const summary = await importSofEventTypesCsv(text);
      await qc.invalidateQueries({ queryKey: ["master-sof-event-types"] });
      await qc.invalidateQueries({ queryKey: ["sof-event-type-options"] });
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
        title="SOF event types"
        description="Labels used when logging mother-vessel and lighter-vessel SOF events. Codes are assigned automatically; scope controls which SOF kinds may use each type (mother-only, lighter-only, or shared)."
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
                  Add type
                </Button>
              ) : null
            }
          />
        }
      />
      <CardContent className="space-y-4">
        {!canEdit ? (
          <p className="text-sm text-muted-foreground">
            Use <strong>Edit</strong> to view a type. Export CSV for everyone; import is limited to editors.
          </p>
        ) : null}
        <MasterDataSearchFilters
          idPrefix="set"
          search={search}
          onSearchChange={setSearch}
          placeholder="Code or name…"
          includeInactive={includeInactive}
          onIncludeInactiveChange={setIncludeInactive}
          inactiveLabel="Show deactivated / deleted"
        >
          <div className="flex flex-wrap gap-2">
            <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Scope</span>
            {scopeTabs.map((t) => (
              <Button
                key={t.id}
                type="button"
                variant={scopeTab === t.id ? "secondary" : "outline"}
                size="sm"
                className={cn("h-8", scopeTab === t.id && "border-transparent")}
                onClick={() => setScopeTab(t.id)}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </MasterDataSearchFilters>

        {listQ.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : listQ.isError ? (
          <p className="text-sm text-destructive">{parseApiErr(listQ.error)}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No types match your filters.</p>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Code</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Scope</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium">Events</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="min-w-[9rem] px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pager.pageItems.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 font-mono text-xs">{row.code}</td>
                      <td className="px-3 py-2 font-medium">{row.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{fmtScope(row.scope)}</td>
                      <td className="px-3 py-2">
                        {row.category === "HOLD_DELAY" ? (
                          <Badge variant="warning">Hold / delay</Badge>
                        ) : (
                          <span className="text-muted-foreground">Normal</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{row._count.sofEvents}</td>
                      <td className="px-3 py-2">
                        {row.deletedAt ? (
                          <Badge variant="warning">Deleted</Badge>
                        ) : row.isActive ? (
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
                          {canEdit && row.deletedAt === null && row.isActive ? (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={deleteM.isPending}
                              onClick={() => {
                                if (
                                  !window.confirm(
                                    `Archive type “${row.name}”? Existing SOF rows keep their link; new events cannot pick it until restored or recreated.`
                                  )
                                ) {
                                  return;
                                }
                                deleteM.mutate(row.id, {
                                  onError: (e) => window.alert(parseApiErr(e))
                                });
                              }}
                            >
                              Delete
                            </Button>
                          ) : null}
                          {canEdit && row.deletedAt !== null ? (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={restoreM.isPending}
                              onClick={() => {
                                if (!window.confirm(`Restore type “${row.name}”?`)) return;
                                restoreM.mutate(row, {
                                  onError: (e: unknown) => window.alert(parseApiErr(e))
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
        <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-md">
          <div>
            <SheetTitle>{creating ? "New SOF event type" : "SOF event type"}</SheetTitle>
            <SheetDescription>
              {creating
                ? "Choose how this label applies to mother vs lighter vessel statements."
                : "Rename or change scope. Existing SOF events keep their reference."}
            </SheetDescription>
          </div>

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

          <div className="space-y-2">
            <Label htmlFor="set-name">Display name</Label>
            <Input
              id="set-name"
              value={name}
              disabled={readOnly || Boolean(!creating && editing?.deletedAt)}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="set-scope">Scope</Label>
            <select
              id="set-scope"
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              value={scope}
              disabled={readOnly || Boolean(!creating && editing?.deletedAt)}
              onChange={(e) => setScope(e.target.value)}
            >
              {SOF_EVENT_TYPE_SCOPES.map((s) => (
                <option key={s} value={s}>
                  {fmtScope(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="set-category">Category</Label>
            <select
              id="set-category"
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              value={category}
              disabled={readOnly || Boolean(!creating && editing?.deletedAt)}
              onChange={(e) => setCategory(e.target.value as SofEventTypeCategoryUi)}
            >
              {SOF_EVENT_TYPE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {fmtCategory(c)}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Hold / delay flags every SOF event of this type as a hold automatically.
            </p>
          </div>

          {!creating && editing?.deletedAt === null ? (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={isActive}
                disabled={readOnly}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 rounded border border-input"
              />
              Active
            </label>
          ) : null}

          {!readOnly && (creating || editing?.deletedAt === null) ? (
            <Button type="button" disabled={saveM.isPending || !name.trim()} onClick={() => saveM.mutate()}>
              Save
            </Button>
          ) : null}

          {!readOnly && !creating && editing?.deletedAt !== null ? (
            <Button
              type="button"
              variant="secondary"
              disabled={restoreM.isPending}
              onClick={() => {
                if (!editing || !window.confirm(`Restore “${editing.name}”?`)) return;
                restoreM.mutate(editing, {
                  onError: (e: unknown) => window.alert(parseApiErr(e))
                });
              }}
            >
              Restore type
            </Button>
          ) : null}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
