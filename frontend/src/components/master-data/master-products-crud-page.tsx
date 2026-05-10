"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

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
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useMasterCrud } from "@/hooks/use-master-crud";
import { useUserProfile } from "@/components/providers/auth-provider";
import {
  createMasterProduct,
  fetchMasterProducts,
  patchMasterProduct,
  purgeMasterProduct,
  softDeleteMasterProduct
} from "@/lib/master-data-api";
import {
  exportProductsCsv,
  formatCsvImportSummary,
  importProductsCsv
} from "@/lib/master-data-csv-bridge";
import { canEditMasterData } from "@/lib/master-data-permissions";
import { parseApiErr } from "@/lib/parse-api-error";
import { masterDataKeys } from "@/lib/query-keys";
import { toast } from "@/lib/toast";
import { PRODUCT_TYPES, type MasterProductRow } from "@/types/vms";

export function MasterProductsCrudPage() {
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
  const [editing, setEditing] = useState<MasterProductRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("OTHER");
  const [specification, setSpecification] = useState("");
  const [hsCode, setHsCode] = useState("");
  const [defaultUom, setDefaultUom] = useState("MT");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!sheetOpen) setFormError(null);
  }, [sheetOpen]);

  const {
    listQ,
    pager,
    deleteM,
    restoreM,
    purgeM,
    invalidateList,
    runRowAction
  } = useMasterCrud<MasterProductRow>({
    queryKey: masterDataKeys.products(),
    fetchList: fetchMasterProducts,
    search: debouncedSearch,
    includeInactive,
    softDelete: softDeleteMasterProduct,
    restore: (id) => patchMasterProduct(id, { isActive: true }),
    purge: purgeMasterProduct
  });
  const rows = pager.pageItems;

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setName("");
    setType("OTHER");
    setSpecification("");
    setHsCode("");
    setDefaultUom("MT");
    setIsActive(true);
    setSheetOpen(true);
  };

  const openDetails = (row: MasterProductRow) => {
    setCreating(false);
    setEditing(row);
    setName(row.name);
    setType(row.type);
    setSpecification(row.specification ?? "");
    setHsCode(row.hsCode ?? "");
    setDefaultUom(row.defaultUom || "MT");
    setIsActive(row.isActive);
    setSheetOpen(true);
  };

  const saveM = useMutation({
    mutationFn: async () => {
      if (creating) {
        return createMasterProduct({
          name: name.trim(),
          type,
          specification: specification.trim() || null,
          hsCode: hsCode.trim() || null,
          defaultUom: defaultUom.trim() || "MT"
        });
      }
      if (!editing) throw new Error("Nothing to save.");
      return patchMasterProduct(editing.id, {
        name: name.trim(),
        type,
        specification: specification.trim() || null,
        hsCode: hsCode.trim() || null,
        defaultUom: defaultUom.trim() || "MT",
        isActive
      });
    },
    onSuccess: async () => {
      await invalidateList();
      setSheetOpen(false);
    },
    onError: (e: unknown) => setFormError(parseApiErr(e))
  });

  const onExportCsv = async () => {
    setExportBusy(true);
    try {
      await exportProductsCsv({
        search: debouncedSearch || undefined,
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
      const summary = await importProductsCsv(text);
      await invalidateList();
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
        title="Products"
        description="Cargo products used on contracts, cargo lines, and trips."
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
            Use <strong>Edit</strong> to view a product. Export CSV is available to everyone. Import and delete require
            editor role.
          </p>
        ) : null}
        <MasterDataSearchFilters
          idPrefix="p"
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
          <p className="text-sm text-muted-foreground">No products match your filters.</p>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Code</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="min-w-[9rem] px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pager.pageItems.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-mono text-xs text-foreground">{row.code}</td>
                    <td className="px-3 py-2 font-medium">{row.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.type}</td>
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
                            onClick={() =>
                              runRowAction(
                                deleteM,
                                row.id,
                                `Delete (deactivate) product “${row.name}”?`
                              )
                            }
                          >
                            Delete
                          </Button>
                        ) : null}
                        {canEdit && !row.isActive ? (
                          <>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={restoreM.isPending}
                              onClick={() =>
                                runRowAction(restoreM, row.id, `Restore product “${row.name}”?`)
                              }
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
                                  `Permanently delete product “${row.name}”? This cannot be undone. It fails while cargoes, contracts, movements, or other records still reference this product.`
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
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
          <SheetTitle>{creating ? "Add product" : "Product details"}</SheetTitle>
          <SheetDescription>
            {readOnly ? "Read-only." : "Product code is assigned automatically. HS code and specification are optional."}
          </SheetDescription>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1 pt-4">
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            {!creating && editing ? (
              <div className="space-y-2">
                <Label htmlFor="p-code-ro">Code</Label>
                <Input
                  id="p-code-ro"
                  readOnly
                  disabled
                  className="font-mono text-xs"
                  value={editing.code}
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="p-type">Type</Label>
              <select
                id="p-type"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm disabled:opacity-50"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={readOnly}
              >
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-name">Name</Label>
              <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-spec">Specification</Label>
              <Input
                id="p-spec"
                value={specification}
                onChange={(e) => setSpecification(e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-hs">HS code</Label>
                <Input id="p-hs" value={hsCode} onChange={(e) => setHsCode(e.target.value)} disabled={readOnly} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-uom">Default UOM</Label>
                <Input id="p-uom" value={defaultUom} onChange={(e) => setDefaultUom(e.target.value)} disabled={readOnly} />
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
