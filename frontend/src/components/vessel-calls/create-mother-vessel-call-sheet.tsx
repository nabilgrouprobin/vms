"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { invalidateMotherLighterPickerCaches } from "@/components/workspace/mother-lighter-vessel-picker-panel";
import { fetchMasterVessels } from "@/lib/master-data-api";
import { parseApiErr } from "@/lib/parse-api-error";
import { createVesselCall } from "@/lib/vessel-calls-api";
import type { MasterVesselKind, MasterVesselRow, Paginated } from "@/types/vms";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  /** Called after a successful create so the host can navigate / refresh selection. */
  onCreated: (vesselCallId: string) => void | Promise<void>;
};

type PortKind = "mother" | "lighter";

const copy: Record<
  PortKind,
  {
    title: string;
    description: ReactNode;
    hullLabel: string;
    hullPlaceholder: string;
    emptyHull: string;
  }
> = {
  mother: {
    title: "New mother vessel call",
    description: (
      <>
        Opens a port visit for an existing mother hull from Master data. The call number is assigned
        automatically (date · hull id · daily sequence, Asia/Dhaka). Register hulls under{" "}
        <Link href="/master-data/mother-vessels" className="underline">
          Mother vessels
        </Link>
        .
      </>
    ),
    hullLabel: "Mother hull",
    hullPlaceholder: "Search hull name or IMO…",
    emptyHull: "No active mother hulls match. Register one in Master data first."
  },
  lighter: {
    title: "New lighter port call",
    description: (
      <>
        Opens a port visit for an existing lighter hull from Master data. The call number is assigned
        automatically. Register hulls under{" "}
        <Link href="/master-data/lighters" className="underline">
          Lighters
        </Link>
        .
      </>
    ),
    hullLabel: "Lighter hull",
    hullPlaceholder: "Search lighter name or IMO…",
    emptyHull: "No active lighter hulls match. Register one in Master data first."
  }
};

function CreatePortCallSheet({ portKind, ...props }: Props & { portKind: PortKind }) {
  const { open, onOpenChange, canEdit, onCreated } = props;
  const qc = useQueryClient();
  const c = copy[portKind];
  const masterKind: MasterVesselKind = portKind === "lighter" ? "lighter" : "mother";

  const [hullSearch, setHullSearch] = useState("");
  const debouncedHullSearch = useDebouncedValue(hullSearch, 300);
  const [vesselId, setVesselId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setHullSearch("");
      setVesselId(null);
      setError(null);
    }
  }, [open]);

  const hullsQ = useInfiniteQuery({
    queryKey: ["create-vessel-call-hulls", portKind, debouncedHullSearch],
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
    queryFn: async ({ pageParam }) =>
      fetchMasterVessels(masterKind, {
        limit: 24,
        cursor: pageParam,
        search: debouncedHullSearch || undefined,
        includeInactive: false
      }),
    getNextPageParam: (last: Paginated<MasterVesselRow>) => last.nextCursor ?? undefined,
    enabled: open && canEdit
  });

  const hullRows = useMemo(
    () => hullsQ.data?.pages.flatMap((p) => p.data) ?? [],
    [hullsQ.data]
  );

  const createM = useMutation({
    mutationFn: () =>
      createVesselCall({
        vesselId: vesselId!,
        hullKind: portKind
      }),
    onSuccess: async (row) => {
      await invalidateMotherLighterPickerCaches(qc);
      await qc.invalidateQueries({ queryKey: ["sof-options"] });
      onOpenChange(false);
      await onCreated(row.id);
    },
    onError: (e: unknown) => setError(parseApiErr(e))
  });

  const canSubmit = !!vesselId && !createM.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetTitle>{c.title}</SheetTitle>
        <SheetDescription>{c.description}</SheetDescription>

        {!canEdit ? (
          <p className="text-sm text-muted-foreground">
            Your role does not allow creating vessel calls.
          </p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1 pt-2">
            <section className="space-y-2">
              <Label htmlFor="hull-search">{c.hullLabel}</Label>
              <Input
                id="hull-search"
                placeholder={c.hullPlaceholder}
                value={hullSearch}
                onChange={(e) => setHullSearch(e.target.value)}
              />
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
                {hullsQ.isLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : hullRows.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">{c.emptyHull}</p>
                ) : (
                  hullRows.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      className={
                        vesselId === h.id
                          ? "w-full rounded-md border border-primary bg-primary/5 px-2 py-2 text-left text-sm"
                          : "w-full rounded-md border border-transparent px-2 py-2 text-left text-sm hover:bg-muted/70"
                      }
                      onClick={() => setVesselId(h.id)}
                    >
                      <span className="font-medium">{h.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {h.hullDisplayCode != null && h.hullDisplayCode > 0
                          ? `Hull #${String(h.hullDisplayCode).padStart(3, "0")}`
                          : "Hull registry pending"}
                        {h.imoNo ? ` · IMO ${h.imoNo}` : ""}
                      </span>
                    </button>
                  ))
                )}
              </div>
              {hullsQ.hasNextPage ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  disabled={hullsQ.isFetchingNextPage}
                  onClick={() => void hullsQ.fetchNextPage()}
                >
                  {hullsQ.isFetchingNextPage ? "Loading…" : "Load more hulls"}
                </Button>
              ) : null}
            </section>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="mt-auto flex flex-wrap gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!canSubmit}
                onClick={() => {
                  setError(null);
                  createM.mutate();
                }}
              >
                {createM.isPending ? "Creating…" : "Create call"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function CreateMotherVesselCallSheet(props: Props) {
  return <CreatePortCallSheet portKind="mother" {...props} />;
}

export function CreateLighterVesselCallSheet(props: Props) {
  return <CreatePortCallSheet portKind="lighter" {...props} />;
}
