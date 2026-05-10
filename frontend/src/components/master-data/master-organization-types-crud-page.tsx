"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { MasterDataCardHeader } from "@/components/master-data/master-data-card-header";
import { MasterDataSearchFilters } from "@/components/master-data/master-data-search-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MasterDataCsvToolbar } from "@/components/data-table/master-data-csv-toolbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useMasterCrud } from "@/hooks/use-master-crud";
import { useUserProfile } from "@/components/providers/auth-provider";
import {
  createMasterOrganizationType,
  fetchMasterOrganizationTypes,
  patchMasterOrganizationType,
  purgeMasterOrganizationType,
  softDeleteMasterOrganizationType
} from "@/lib/master-data-api";
import {
  exportOrganizationTypesCsv,
  formatCsvImportSummary,
  importOrganizationTypesCsv
} from "@/lib/master-data-csv-bridge";
import { canEditMasterData } from "@/lib/master-data-permissions";
import { parseApiErr } from "@/lib/parse-api-error";
import { masterDataKeys } from "@/lib/query-keys";
import { toast } from "@/lib/toast";
import type { MasterOrganizationTypeRow } from "@/types/vms";

export function MasterOrganizationTypesCrudPage() {
  const profile = useUserProfile();
  const canEdit = canEditMasterData(profile);
  const readOnly = !canEdit;
  const fileRef = useRef<HTMLInputElement>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<MasterOrganizationTypeRow | null>(null);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!sheetOpen) setFormError(null);
  }, [sheetOpen]);

  const {
    listQ,
    pager,
    deleteM,
    purgeM,
    invalidateList: invalidateAll,
    runRowAction
  } = useMasterCrud<MasterOrganizationTypeRow>({
    queryKey: masterDataKeys.organizationTypes(),
    fetchList: fetchMasterOrganizationTypes,
    search: debouncedSearch,
    includeInactive,
    softDelete: softDeleteMasterOrganizationType,
    purge: purgeMasterOrganizationType,
    extraInvalidateKeys: [["organization-type-options"]]
  });
  const rows = pager.pageItems;

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setName("");
    setIsActive(true);
    setSheetOpen(true);
  };

  const openDetails = (row: MasterOrganizationTypeRow) => {
    setCreating(false);
    setEditing(row);
    setName(row.name);
    setIsActive(row.isActive);
    setSheetOpen(true);
  };

  const saveM = useMutation({
    mutationFn: async () => {
      if (creating) {
        return createMasterOrganizationType({
          name: name.trim()
        });
      }
      if (!editing) throw new Error("Nothing to save.");
      return patchMasterOrganizationType(editing.id, {
        name: name.trim(),
        isActive
      });
    },
    onSuccess: async () => {
      await invalidateAll();
      setSheetOpen(false);
    },
    onError: (e: unknown) => setFormError(parseApiErr(e))
  });

  /**
   * Restore is a small custom flow: after success, also refresh the open
   * sheet's `editing` row so its `isActive` toggle flips immediately.
   */
  const restoreM = useMutation({
    mutationFn: (row: MasterOrganizationTypeRow) =>
      patchMasterOrganizationType(row.id, { isActive: true }),
    onSuccess: async (updated) => {
      await invalidateAll();
      setEditing((prev) => (prev?.id === updated.id ? updated : prev));
    }
  });

  const onExportCsv = async () => {
    setExportBusy(true);
    try {
      await exportOrganizationTypesCsv({
        search: debouncedSearch,
        includeInactive
      });
    } catch (e) {
      toast.error(parseApiErr(e));
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
      const summary = await importOrganizationTypesCsv(text);
      await invalidateAll();
      toast.success(formatCsvImportSummary("Import finished.", summary));
    } catch (err) {
      toast.error(parseApiErr(err));
    } finally {
      setImportBusy(false);
    }
  };

  return (
    <Card>
      <MasterDataCardHeader
        title="Organization types"
        description="Classifications used when registering organizations (agents, banks, carriers, etc.). Codes are assigned automatically for new rows."
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
          idPrefix="oty"
          search={search}
          onSearchChange={setSearch}
          placeholder="Code or name…"
          includeInactive={includeInactive}
          onIncludeInactiveChange={setIncludeInactive}
          inactiveLabel="Show deactivated / deleted"
        />

        {listQ.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : listQ.isError ? (
          <p className="text-sm text-destructive">{parseApiErr(listQ.error)}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No organization types match your filters.</p>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Code</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Organizations</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="min-w-[9rem] px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pager.pageItems.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 font-mono text-xs">{row.code}</td>
                      <td className="px-3 py-2 font-medium">{row.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row._count.organizations}</td>
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
                              onClick={() =>
                                runRowAction(
                                  deleteM,
                                  row.id,
                                  `Archive organization type “${row.name}”? Organizations still assigned must be moved before this succeeds.`
                                )
                              }
                            >
                              Delete
                            </Button>
                          ) : null}
                          {canEdit && row.deletedAt !== null ? (
                            <>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={restoreM.isPending}
                                onClick={() => {
                                  if (!window.confirm(`Restore type “${row.name}”?`)) return;
                                  restoreM.mutate(row, {
                                    onError: (e: unknown) => toast.error(parseApiErr(e))
                                  });
                                }}
                              >
                                Restore
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                disabled={purgeM.isPending}
                                onClick={() =>
                                  runRowAction(
                                    purgeM,
                                    row.id,
                                    `Permanently delete organization type “${row.name}”? This cannot be undone. Zero organizations must reference this type.`
                                  )
                                }
                              >
                                Delete forever
                              </Button>
                            </>
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
            <SheetTitle>{creating ? "New organization type" : "Organization type"}</SheetTitle>
            <SheetDescription>
              {creating
                ? "Add a catalog entry before assigning organizations."
                : "Rename or change activation. Existing organizations keep their link."}
            </SheetDescription>
          </div>

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

          {!creating && editing ? (
            <div className="space-y-2">
              <Label htmlFor="oty-code-ro">Code</Label>
              <Input id="oty-code-ro" readOnly disabled className="font-mono text-xs" value={editing.code} />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="oty-name">Display name</Label>
            <Input
              id="oty-name"
              value={name}
              disabled={readOnly || Boolean(!creating && editing?.deletedAt)}
              onChange={(e) => setName(e.target.value)}
            />
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
                  onError: (e: unknown) => toast.error(parseApiErr(e))
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
