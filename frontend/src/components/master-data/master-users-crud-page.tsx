"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

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
import { useCursorBackedPagination } from "@/hooks/use-cursor-backed-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getUserProfile } from "@/lib/auth-storage";
import {
  addUserRoleAssignmentsBatch,
  createMasterUser,
  fetchAppRoles,
  fetchLocationOptions,
  fetchMasterUsers,
  fetchOrganizationOptions,
  fetchUserRoleAssignments,
  patchMasterUser,
  removeUserRoleAssignment,
  softDeleteMasterUser
} from "@/lib/master-data-api";
import {
  exportUsersCsv,
  formatCsvImportSummary,
  importUsersCsv
} from "@/lib/master-data-csv-bridge";
import { canEditMasterData } from "@/lib/master-data-permissions";
import { parseApiErr } from "@/lib/parse-api-error";
import { APP_ROLES, type MasterUserRow, type Paginated, type UserRoleAssignmentRow } from "@/types/vms";

export function MasterUsersCrudPage() {
  const qc = useQueryClient();
  const profile = useMemo(() => getUserProfile(), []);
  const canEdit = canEditMasterData(profile);
  const readOnly = !canEdit;
  const fileRef = useRef<HTMLInputElement>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<MasterUserRow | null>(null);
  const [creating, setCreating] = useState(false);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const [pickedRoles, setPickedRoles] = useState<string[]>([]);
  const [batchLocationId, setBatchLocationId] = useState("");
  const identityLabel = (row: MasterUserRow) => row.email ?? row.phone;

  const togglePickedRole = (role: string) => {
    setPickedRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  useEffect(() => {
    if (!sheetOpen) setFormError(null);
  }, [sheetOpen]);

  const rolesEnabled = Boolean(sheetOpen && editing && !creating && editing.deletedAt === null);

  const appRolesQ = useQuery({
    queryKey: ["master-app-roles"],
    queryFn: fetchAppRoles,
    staleTime: 600_000
  });

  const appRoles = appRolesQ.data?.length ? appRolesQ.data : [...APP_ROLES];

  const userRolesQ = useQuery({
    queryKey: ["master-user-roles", editing?.id],
    enabled: rolesEnabled && Boolean(editing?.id),
    queryFn: () => fetchUserRoleAssignments(editing!.id)
  });

  const locationsQ = useQuery({
    queryKey: ["location-options"],
    queryFn: fetchLocationOptions,
    enabled: rolesEnabled
  });

  const orgOptionsQ = useQuery({
    queryKey: ["organization-options"],
    queryFn: fetchOrganizationOptions,
    enabled: sheetOpen,
    staleTime: 300_000
  });

  const listQ = useInfiniteQuery({
    queryKey: ["master-users", debouncedSearch, includeInactive],
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
    queryFn: async ({ pageParam }) =>
      fetchMasterUsers({
        limit: 24,
        cursor: pageParam,
        search: debouncedSearch || undefined,
        includeInactive
      }),
    getNextPageParam: (last: Paginated<MasterUserRow>) => last.nextCursor ?? undefined
  });

  const rows = useMemo(
    () => listQ.data?.pages.flatMap((p) => p.data) ?? [],
    [listQ.data]
  );

  const organizationSelectOptions = useMemo(() => {
    const fromApi = orgOptionsQ.data ?? [];
    const oid = organizationId.trim();
    if (oid && !fromApi.some((o) => o.id === oid)) {
      return [...fromApi, { id: oid, code: oid.slice(0, 8), name: "Current link (inactive or missing)", type: "—" }];
    }
    return fromApi;
  }, [orgOptionsQ.data, organizationId]);

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
    setEmail("");
    setPhone("");
    setFullName("");
    setPassword("");
    setOrganizationId("");
    setIsActive(true);
    setPickedRoles([]);
    setBatchLocationId("");
    setSheetOpen(true);
  };

  const openDetails = (row: MasterUserRow) => {
    setCreating(false);
    setEditing(row);
    setEmail(row.email ?? "");
    setPhone(row.phone);
    setFullName(row.fullName);
    setPassword("");
    setOrganizationId(row.organizationId ?? "");
    setIsActive(row.isActive);
    setPickedRoles([]);
    setBatchLocationId("");
    setSheetOpen(true);
  };

  const saveM = useMutation({
    mutationFn: async () => {
      const org = organizationId.trim();
      if (creating) {
        if (!password || password.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }
        return createMasterUser({
          email: email.trim() || null,
          phone: phone.trim(),
          fullName: fullName.trim(),
          password,
          organizationId: org ? org : null
        });
      }
      if (!editing) throw new Error("Nothing to save.");
      const body: Parameters<typeof patchMasterUser>[1] = {
        email: email.trim() || null,
        phone: phone.trim(),
        fullName: fullName.trim(),
        isActive,
        organizationId: org ? org : null
      };
      if (password.trim().length > 0) {
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        body.password = password;
      }
      return patchMasterUser(editing.id, body);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["master-users"] });
      setSheetOpen(false);
    },
    onError: (e: unknown) => setFormError(parseApiErr(e))
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => softDeleteMasterUser(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["master-users"] });
    }
  });

  const restoreM = useMutation({
    mutationFn: (row: MasterUserRow) => patchMasterUser(row.id, { isActive: true }),
    onSuccess: async (updated) => {
      await qc.invalidateQueries({ queryKey: ["master-users"] });
      setEditing((prev) => (prev?.id === updated.id ? updated : prev));
    }
  });

  const addRolesBatchM = useMutation({
    mutationFn: async () => {
      if (!editing) throw new Error("No user selected.");
      if (pickedRoles.length === 0) throw new Error("Select at least one role.");
      return addUserRoleAssignmentsBatch(editing.id, {
        roles: pickedRoles,
        locationId: batchLocationId.trim() ? batchLocationId.trim() : null
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["master-user-roles", editing?.id] });
      await qc.invalidateQueries({ queryKey: ["master-users"] });
      setPickedRoles([]);
      setBatchLocationId("");
    },
    onError: (e: unknown) => window.alert(parseApiErr(e))
  });

  const removeRoleM = useMutation({
    mutationFn: async (assignmentId: string) => {
      if (!editing) throw new Error("No user selected.");
      return removeUserRoleAssignment(editing.id, assignmentId);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["master-user-roles", editing?.id] });
      await qc.invalidateQueries({ queryKey: ["master-users"] });
    },
    onError: (e: unknown) => window.alert(parseApiErr(e))
  });

  const fmtRoles = (a: UserRoleAssignmentRow) => {
    const loc = a.location ? a.location.code : "global";
    return `${a.role.replace(/_/g, " ")} (${loc})`;
  };

  const onExportCsv = async () => {
    setExportBusy(true);
    try {
      await exportUsersCsv({
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
      const summary = await importUsersCsv(text);
      await qc.invalidateQueries({ queryKey: ["master-users"] });
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
        title="Users & roles"
        description="Maintain login identities under Master files. Role assignments grant menu visibility — scopes tied to a location apply only where relevant workflow expects them."
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
                  Add user
                </Button>
              ) : null
            }
          />
        }
      />
      <CardContent className="space-y-4">
        {!canEdit ? (
          <p className="text-sm text-muted-foreground">
            Editor privileges unlock invitations and password resets. Everyone else may inspect registry contacts here when visibility permits. Export CSV is available to everyone; import requires editor role (new rows need a password column).
          </p>
        ) : null}
        <MasterDataSearchFilters
          idPrefix="mu"
          search={search}
          onSearchChange={setSearch}
          placeholder="Phone, email, name…"
          includeInactive={includeInactive}
          onIncludeInactiveChange={setIncludeInactive}
          inactiveLabel="Show deactivated / deleted"
        />

        {listQ.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : listQ.isError ? (
          <p className="text-sm text-destructive">{parseApiErr(listQ.error)}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users match your filters.</p>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Phone</th>
                    <th className="px-3 py-2 font-medium">Full name</th>
                    <th className="px-3 py-2 font-medium">Roles</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="min-w-[9rem] px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pager.pageItems.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 font-medium text-foreground">{row.email ?? "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.phone}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.fullName}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row._count.roles}</td>
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
                                if (!window.confirm(`Deactivate login for ${identityLabel(row)}?`)) return;
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
                                if (!window.confirm(`Restore ${identityLabel(row)}?`)) return;
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
            <SheetTitle>{creating ? "New user" : "Edit user"}</SheetTitle>
            <SheetDescription>
              {creating ? "Create credentials plus baseline roles after saving via assignments." : "Update identity fields or elevate scopes via roles."}
            </SheetDescription>
          </div>

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

          <div className="space-y-2">
            <Label htmlFor="mu-email">Email</Label>
            <Input
              id="mu-email"
              type="email"
              autoComplete="email"
              value={email}
              disabled={readOnly || Boolean(!creating && editing?.deletedAt)}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mu-phone">Phone</Label>
            <Input
              id="mu-phone"
              value={phone}
              disabled={readOnly || Boolean(!creating && editing?.deletedAt)}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mu-name">Full name</Label>
            <Input
              id="mu-name"
              value={fullName}
              disabled={readOnly || Boolean(!creating && editing?.deletedAt)}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mu-password">{creating ? "Password" : "New password (optional)"}</Label>
            <Input
              id="mu-password"
              type="password"
              autoComplete="new-password"
              value={password}
              disabled={readOnly || Boolean(!creating && editing?.deletedAt)}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={creating ? "Minimum 8 characters" : "Leave blank to keep existing"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mu-org">Organization</Label>
            <select
              id="mu-org"
              value={organizationId}
              disabled={readOnly || Boolean(!creating && editing?.deletedAt) || orgOptionsQ.isLoading}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="">— None —</option>
              {organizationSelectOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code} · {o.name}
                  {o.type && o.type !== "—" ? ` (${o.type.replace(/_/g, " ")})` : ""}
                </option>
              ))}
            </select>
            {orgOptionsQ.isError ? (
              <p className="text-xs text-destructive">{parseApiErr(orgOptionsQ.error)}</p>
            ) : null}
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
            <Button type="button" disabled={saveM.isPending} onClick={() => saveM.mutate()}>
              Save user
            </Button>
          ) : null}

          {!readOnly && !creating && editing?.deletedAt !== null ? (
            <Button
              type="button"
              variant="secondary"
              disabled={restoreM.isPending}
              onClick={() => {
                if (!editing || !window.confirm(`Restore ${identityLabel(editing)}?`)) return;
                restoreM.mutate(editing, {
                  onError: (e: unknown) => window.alert(parseApiErr(e))
                });
              }}
            >
              Restore account
            </Button>
          ) : null}

          {!creating && editing?.deletedAt !== null ? (
            <p className="text-sm text-muted-foreground">
              Restore this account before editing roles — assignments stay hidden while the login remains archived.
            </p>
          ) : null}

          {!creating && editing?.deletedAt === null ? (
            <div className="border-t border-border pt-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Roles</p>
                <p className="text-xs text-muted-foreground">
                  Removing every role blocks interactive login until at least one entry exists again.
                </p>
              </div>

              {userRolesQ.isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : userRolesQ.isError ? (
                <p className="text-sm text-destructive">{parseApiErr(userRolesQ.error)}</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {(userRolesQ.data ?? []).length === 0 ? (
                    <li className="text-muted-foreground">No roles yet.</li>
                  ) : (
                    (userRolesQ.data ?? []).map((r) => (
                      <li
                        key={r.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                      >
                        <span>{fmtRoles(r)}</span>
                        {!readOnly ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={removeRoleM.isPending}
                            onClick={() => removeRoleM.mutate(r.id)}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </li>
                    ))
                  )}
                </ul>
              )}

              {!readOnly ? (
                <div className="space-y-2 rounded-md border border-dashed border-border p-3">
                  <Label>Assign roles (multi-select)</Label>
                  <p className="text-xs text-muted-foreground">
                    Tick every role to add in one step. Duplicates are skipped if the user already has the same role and
                    location scope.
                  </p>
                  <div className="max-h-52 space-y-1.5 overflow-y-auto rounded-md border border-border bg-muted/20 p-2">
                    {appRoles.map((role) => (
                      <label
                        key={role}
                        className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                      >
                        <input
                          type="checkbox"
                          checked={pickedRoles.includes(role)}
                          disabled={editing?.deletedAt !== null}
                          onChange={() => togglePickedRole(role)}
                          className="size-4 shrink-0 rounded border border-input"
                        />
                        <span>{role.replace(/_/g, " ")}</span>
                      </label>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Location scope (optional)</Label>
                    <select
                      value={batchLocationId}
                      onChange={(e) => setBatchLocationId(e.target.value)}
                      disabled={editing?.deletedAt !== null}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    >
                      <option value="">All locations</option>
                      {(locationsQ.data ?? []).map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.code} · {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={addRolesBatchM.isPending || editing?.deletedAt !== null || pickedRoles.length === 0}
                      onClick={() => addRolesBatchM.mutate()}
                    >
                      Assign selected
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={editing?.deletedAt !== null || pickedRoles.length === 0}
                      onClick={() => setPickedRoles([])}
                    >
                      Clear selection
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
