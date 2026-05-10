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
  createMasterLocation,
  fetchMasterLocations,
  patchMasterLocation,
  purgeMasterLocation,
  softDeleteMasterLocation
} from "@/lib/master-data-api";
import {
  exportLocationsCsv,
  formatCsvImportSummary,
  importLocationsCsv
} from "@/lib/master-data-csv-bridge";
import { canEditMasterData } from "@/lib/master-data-permissions";
import { parseApiErr } from "@/lib/parse-api-error";
import { masterDataKeys } from "@/lib/query-keys";
import { toast } from "@/lib/toast";
import { LOCATION_TYPES, type MasterLocationRow } from "@/types/vms";

export function MasterLocationsCrudPage() {
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
  const [editing, setEditing] = useState<MasterLocationRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("PORT");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [division, setDivision] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [postalCode, setPostalCode] = useState("");
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
  } = useMasterCrud<MasterLocationRow>({
    queryKey: masterDataKeys.locations(),
    fetchList: fetchMasterLocations,
    search: debouncedSearch,
    includeInactive,
    softDelete: softDeleteMasterLocation,
    restore: (id) => patchMasterLocation(id, { isActive: true }),
    purge: purgeMasterLocation,
    extraInvalidateKeys: [["location-options"]]
  });
  const rows = pager.pageItems;

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setName("");
    setType("PORT");
    setAddress("");
    setDistrict("");
    setDivision("");
    setCountry("Bangladesh");
    setPostalCode("");
    setIsActive(true);
    setSheetOpen(true);
  };

  const openDetails = (row: MasterLocationRow) => {
    setCreating(false);
    setEditing(row);
    setName(row.name);
    setType(row.type);
    setAddress(row.address ?? "");
    setDistrict(row.district ?? "");
    setDivision(row.division ?? "");
    setCountry(row.country || "Bangladesh");
    setPostalCode(row.postalCode ?? "");
    setIsActive(row.isActive);
    setSheetOpen(true);
  };

  const saveM = useMutation({
    mutationFn: async () => {
      if (creating) {
        return createMasterLocation({
          name: name.trim(),
          type,
          address: address.trim() || null,
          district: district.trim() || null,
          division: division.trim() || null,
          country: country.trim() || "Bangladesh",
          postalCode: postalCode.trim() || null
        });
      }
      if (!editing) throw new Error("Nothing to save.");
      return patchMasterLocation(editing.id, {
        name: name.trim(),
        type,
        address: address.trim() || null,
        district: district.trim() || null,
        division: division.trim() || null,
        country: country.trim() || null,
        postalCode: postalCode.trim() || null,
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
      await exportLocationsCsv({
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
      const summary = await importLocationsCsv(text);
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
        title="Locations"
        description="Ports, anchorages, and other sites. Code must be unique per location type."
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
            Use <strong>Edit</strong> to view a location. Export CSV for everyone; import and delete for editors.
          </p>
        ) : null}
        <MasterDataSearchFilters
          idPrefix="l"
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
          <p className="text-sm text-muted-foreground">No locations match your filters.</p>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Code</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">District</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="min-w-[9rem] px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pager.pageItems.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">{row.code}</td>
                    <td className="px-3 py-2 font-medium">{row.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.type}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.district ?? "—"}</td>
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
                                `Delete (deactivate) location “${row.name}”?`
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
                                runRowAction(restoreM, row.id, `Restore location “${row.name}”?`)
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
                                  `Permanently delete location “${row.name}”? This cannot be undone. It fails while ghats, calls, trips, or warehouses still reference this location.`
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
          <SheetTitle>{creating ? "Add location" : "Location details"}</SheetTitle>
          <SheetDescription>
            {readOnly ? "Read-only." : "Location code is assigned automatically."}
          </SheetDescription>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1 pt-4">
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            {!creating && editing ? (
              <div className="space-y-2">
                <Label htmlFor="l-code-ro">Code</Label>
                <Input id="l-code-ro" readOnly disabled className="font-mono text-xs" value={editing.code} />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="l-type">Type</Label>
              <select
                id="l-type"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm disabled:opacity-50"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={readOnly}
              >
                {LOCATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="l-name">Name</Label>
              <Input id="l-name" value={name} onChange={(e) => setName(e.target.value)} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="l-addr">Address</Label>
              <Input id="l-addr" value={address} onChange={(e) => setAddress(e.target.value)} disabled={readOnly} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="l-dist">District</Label>
                <Input id="l-dist" value={district} onChange={(e) => setDistrict(e.target.value)} disabled={readOnly} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="l-div">Division</Label>
                <Input id="l-div" value={division} onChange={(e) => setDivision(e.target.value)} disabled={readOnly} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="l-country">Country</Label>
                <Input id="l-country" value={country} onChange={(e) => setCountry(e.target.value)} disabled={readOnly} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="l-post">Postal code</Label>
                <Input id="l-post" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} disabled={readOnly} />
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
