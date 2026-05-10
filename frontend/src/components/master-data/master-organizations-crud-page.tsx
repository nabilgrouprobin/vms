"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { MasterDataCsvToolbar } from "@/components/data-table/master-data-csv-toolbar";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { MasterDataCardHeader } from "@/components/master-data/master-data-card-header";
import { MasterDataSearchFilters } from "@/components/master-data/master-data-search-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useMasterCrud } from "@/hooks/use-master-crud";
import { useUserProfile } from "@/components/providers/auth-provider";
import {
  createMasterOrganization,
  fetchMasterOrganizations,
  fetchOrganizationTypeOptions,
  patchMasterOrganization,
  purgeMasterOrganization,
  softDeleteMasterOrganization
} from "@/lib/master-data-api";
import {
  exportOrganizationsCsv,
  formatCsvImportSummary,
  importOrganizationsCsv
} from "@/lib/master-data-csv-bridge";
import { canEditMasterData } from "@/lib/master-data-permissions";
import { parseApiErr } from "@/lib/parse-api-error";
import { masterDataKeys } from "@/lib/query-keys";
import { toast } from "@/lib/toast";
import type { MasterOrganizationRow } from "@/types/vms";

export function MasterOrganizationsCrudPage() {
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
  const [editing, setEditing] = useState<MasterOrganizationRow | null>(null);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [organizationTypeId, setOrganizationTypeId] = useState("");
  const [address, setAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [email, setEmail] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!sheetOpen) setFormError(null);
  }, [sheetOpen]);

  const orgTypesQ = useQuery({
    queryKey: ["organization-type-options"],
    queryFn: fetchOrganizationTypeOptions,
    staleTime: 60_000
  });

  const {
    listQ,
    pager,
    deleteM,
    purgeM,
    invalidateList,
    runRowAction
  } = useMasterCrud<MasterOrganizationRow>({
    queryKey: masterDataKeys.organizations(),
    fetchList: fetchMasterOrganizations,
    search: debouncedSearch,
    includeInactive,
    softDelete: (id) => softDeleteMasterOrganization(id),
    purge: purgeMasterOrganization,
    extraInvalidateKeys: [["organization-options"]]
  });
  const rows = pager.pageItems;

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setName("");
    setOrganizationTypeId(orgTypesQ.data?.[0]?.id ?? "");
    setAddress("");
    setContactPerson("");
    setContactNo("");
    setEmail("");
    setIsActive(true);
    setSheetOpen(true);
  };

  const openDetails = (row: MasterOrganizationRow) => {
    setCreating(false);
    setEditing(row);
    setName(row.name);
    setOrganizationTypeId(row.organizationType.id);
    setAddress(row.address ?? "");
    setContactPerson(row.contactPerson ?? "");
    setContactNo(row.contactNo ?? "");
    setEmail(row.email ?? "");
    setIsActive(row.isActive);
    setSheetOpen(true);
  };

  const saveM = useMutation({
    mutationFn: async () => {
      if (creating) {
        return createMasterOrganization({
          name: name.trim(),
          organizationTypeId,
          address: address.trim() || null,
          contactPerson: contactPerson.trim() || null,
          contactNo: contactNo.trim() || null,
          email: email.trim() || null
        });
      }
      if (!editing) throw new Error("Nothing to save.");
      return patchMasterOrganization(editing.id, {
        name: name.trim(),
        organizationTypeId,
        address: address.trim() || null,
        contactPerson: contactPerson.trim() || null,
        contactNo: contactNo.trim() || null,
        email: email.trim() || null,
        isActive
      });
    },
    onSuccess: async () => {
      await invalidateList();
      setSheetOpen(false);
    },
    onError: (e: unknown) => setFormError(parseApiErr(e))
  });

  /** Custom restore: refresh open `editing` row after success so the toggle flips. */
  const restoreM = useMutation({
    mutationFn: (row: MasterOrganizationRow) => patchMasterOrganization(row.id, { isActive: true }),
    onSuccess: async (updated) => {
      await invalidateList();
      setEditing((prev) => (prev?.id === updated.id ? updated : prev));
    }
  });

  const onExportCsv = async () => {
    setExportBusy(true);
    try {
      await exportOrganizationsCsv({
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
      const summary = await importOrganizationsCsv(text);
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
        title="Organizations"
        description={
          <>
            Companies and counterparties (suppliers, agents, carriers). Organization codes are assigned automatically.
            Organization classifications are maintained under{" "}
            <Link href="/master-data/organization-types" className="font-medium text-primary underline-offset-4 hover:underline">
              Organization types
            </Link>
            .
          </>
        }
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
                  Add organization
                </Button>
              ) : null
            }
          />
        }
      />
      <CardContent className="space-y-4">
        {!canEdit ? (
          <p className="text-sm text-muted-foreground">
            Editors can add and archive organizations. Linked user accounts keep their organization id until you clear
            it on the user record. Export CSV is available to everyone; import requires editor role.
          </p>
        ) : null}
        <MasterDataSearchFilters
          idPrefix="org"
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
          <p className="text-sm text-muted-foreground">No organizations match your filters.</p>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Code</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Users</th>
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
                        <span className="font-mono text-xs text-muted-foreground/90">{row.organizationType.code}</span>
                        <span className="mx-1">·</span>
                        {row.organizationType.name}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{row._count.users}</td>
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
                                runRowAction(deleteM, row.id, `Archive organization “${row.name}”?`)
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
                                  if (!window.confirm(`Restore organization “${row.name}”?`)) return;
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
                                    `Permanently delete organization “${row.name}”? This cannot be undone. It fails while contracts, users, calls, or other records still reference this organization.`
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
        <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-lg">
          <div>
            <SheetTitle>{creating ? "New organization" : "Organization"}</SheetTitle>
            <SheetDescription>
              {creating
                ? "Create the legal or operational entity before linking users."
                : "Update registry details. Code is read-only and assigned by the system."}
            </SheetDescription>
          </div>

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

          {!creating && editing ? (
            <div className="space-y-2">
              <Label htmlFor="org-code-ro">Code</Label>
              <Input
                id="org-code-ro"
                readOnly
                disabled
                className="font-mono text-xs"
                value={editing.code}
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="org-type">Organization type</Label>
            <select
              id="org-type"
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              value={organizationTypeId}
              disabled={
                readOnly ||
                Boolean(!creating && editing?.deletedAt) ||
                orgTypesQ.isLoading ||
                !orgTypesQ.data?.length
              }
              onChange={(e) => setOrganizationTypeId(e.target.value)}
            >
              {(orgTypesQ.data ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code.replace(/_/g, " ")} — {t.name}
                </option>
              ))}
            </select>
            {orgTypesQ.isError ? (
              <p className="text-xs text-destructive">{parseApiErr(orgTypesQ.error)}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              value={name}
              disabled={readOnly || Boolean(!creating && editing?.deletedAt)}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-address">Address</Label>
            <Input
              id="org-address"
              value={address}
              disabled={readOnly || Boolean(!creating && editing?.deletedAt)}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-contact-person">Contact person</Label>
              <Input
                id="org-contact-person"
                value={contactPerson}
                disabled={readOnly || Boolean(!creating && editing?.deletedAt)}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-contact-no">Contact no.</Label>
              <Input
                id="org-contact-no"
                value={contactNo}
                disabled={readOnly || Boolean(!creating && editing?.deletedAt)}
                onChange={(e) => setContactNo(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-email">Email</Label>
            <Input
              id="org-email"
              type="email"
              value={email}
              disabled={readOnly || Boolean(!creating && editing?.deletedAt)}
              onChange={(e) => setEmail(e.target.value)}
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
            <Button
              type="button"
              disabled={!name.trim() || !organizationTypeId || saveM.isPending}
              onClick={() => saveM.mutate()}
            >
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
              Restore organization
            </Button>
          ) : null}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
