"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { SofStatusBadge } from "@/components/sof/sof-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MotherLighterPickerCard,
  PickerListToolbar,
  PickerScrollArea
} from "@/components/workspace/mother-lighter-picker";
import { getApiBase } from "@/lib/api";
import { formatDt } from "@/lib/format";
import { parseApiErr } from "@/lib/parse-api-error";
import { fetchLighterSofs, fetchMotherSofs } from "@/lib/sof-api";
import type { LighterSofListRow, MotherSofListRow, Paginated } from "@/types/vms";

type Variant = "mother" | "lighter";

export function SofDirectoryList({ variant }: { variant: Variant }) {
  const [search, setSearch] = useState("");

  const motherQ = useInfiniteQuery({
    queryKey: ["mother-sof", search],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      fetchMotherSofs({
        limit: 20,
        cursor: pageParam,
        search: search || undefined
      }),
    getNextPageParam: (last: Paginated<MotherSofListRow>) => last.nextCursor ?? undefined,
    enabled: variant === "mother"
  });

  const lighterQ = useInfiniteQuery({
    queryKey: ["lighter-sof", search],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      fetchLighterSofs({
        limit: 20,
        cursor: pageParam,
        search: search || undefined
      }),
    getNextPageParam: (last: Paginated<LighterSofListRow>) => last.nextCursor ?? undefined,
    enabled: variant === "lighter"
  });

  const query = variant === "mother" ? motherQ : lighterQ;

  const rows = useMemo((): MotherSofListRow[] | LighterSofListRow[] => {
    if (variant === "mother") {
      return motherQ.data?.pages.flatMap((p) => p.data) ?? [];
    }
    return lighterQ.data?.pages.flatMap((p) => p.data) ?? [];
  }, [variant, motherQ.data, lighterQ.data]);

  const loadMore = query.hasNextPage ? (
    <Button
      variant="secondary"
      size="sm"
      className="w-full sm:w-auto"
      disabled={query.isFetchingNextPage}
      onClick={() => void query.fetchNextPage()}
    >
      {query.isFetchingNextPage ? "Loading…" : "Load more"}
    </Button>
  ) : null;

  const copy =
    variant === "mother"
      ? {
          title: "Mother vessel SOF",
          description: "Statements of facts linked to mother vessel calls.",
          searchPlaceholder: "Search SOF no., call, vessel…",
          newHref: "/mother-sof/new" as const,
          emptyMessage: "No mother vessel SOF records. Create one or run the backend seed.",
          errorLead: "Could not load the SOF list.",
          errorApiHint: (
            <>
              Request base:{" "}
              <code className="rounded bg-muted px-1 text-foreground">{getApiBase()}</code> (set{" "}
              <code className="rounded bg-muted px-1">NEXT_PUBLIC_API_URL</code> in{" "}
              <code className="rounded bg-muted px-1">frontend/.env</code>, then restart{" "}
              <code className="rounded bg-muted px-1">npm run dev</code>). Backend default is{" "}
              <code className="rounded bg-muted px-1">http://localhost:3000</code>; do not point the
              API URL at the Next.js port (3001).
            </>
          ),
          roleHint: (
            <p className="text-muted-foreground">
              Your user needs a role allowed to view SOF (for example Operations Manager or Mother
              Vessel Admin). After changing roles, sign out and sign in again. Seed demo:{" "}
              <code className="rounded bg-muted px-1">sof.operator.01@example.com</code> then run{" "}
              <code className="rounded bg-muted px-1">npm run seed</code> in{" "}
              <code className="rounded bg-muted px-1">backend</code>.
            </p>
          )
        }
      : {
          title: "Lighter vessel SOF",
          description: "Trip-level statements of facts for lighter operations.",
          searchPlaceholder: "Search SOF no., trip, lighter…",
          newHref: "/lighter-sof/new" as const,
          emptyMessage: "No lighter SOF records. Create a new lighter SOF.",
          errorLead: "Could not load lighter SOF.",
          errorApiHint: (
            <>
              Request base:{" "}
              <code className="rounded bg-muted px-1 text-foreground">{getApiBase()}</code> (set{" "}
              <code className="rounded bg-muted px-1">NEXT_PUBLIC_API_URL</code> in{" "}
              <code className="rounded bg-muted px-1">frontend/.env</code>, then restart{" "}
              <code className="rounded bg-muted px-1">npm run dev</code>). Backend default is{" "}
              <code className="rounded bg-muted px-1">http://localhost:3000</code>.
            </>
          ),
          roleHint: (
            <p className="text-muted-foreground">
              Your user needs a role allowed to view SOF. Sign out and back in after roles are
              updated. Seed demo:{" "}
              <code className="rounded bg-muted px-1">sof.operator.01@example.com</code> and{" "}
              <code className="rounded bg-muted px-1">npm run seed</code> in{" "}
              <code className="rounded bg-muted px-1">backend</code>.
            </p>
          )
        };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.description}</p>
      </div>

      <MotherLighterPickerCard
        toolbar={
          <PickerListToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder={copy.searchPlaceholder}
            trailing={
              <Button variant="outline" size="sm" className="w-full lg:w-auto" asChild>
                <Link href={copy.newHref}>
                  <Plus className="size-4" />
                  New SOF
                </Link>
              </Button>
            }
          />
        }
        footer={loadMore}
      >
        <PickerScrollArea variant="panel">
          {query.isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-36 w-full rounded-lg" />
              ))}
            </div>
          ) : query.isError ? (
            <div className="space-y-2 text-sm text-destructive">
              <p>{copy.errorLead}</p>
              <p className="text-muted-foreground">{copy.errorApiHint}</p>
              <p className="font-medium text-destructive">{parseApiErr(query.error)}</p>
              {String(parseApiErr(query.error)).toLowerCase().includes("insufficient role")
                ? copy.roleHint
                : null}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{copy.emptyMessage}</p>
          ) : variant === "mother" ? (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {(rows as MotherSofListRow[]).map((r) => (
                <li key={r.id} className="min-w-0">
                  <Link href={`/mother-sof/${r.id}`} prefetch className="block h-full">
                    <Card className="h-full transition-colors hover:bg-accent/40">
                      <CardHeader className="flex h-full flex-col gap-3 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <CardTitle className="line-clamp-2 text-base leading-snug">
                              {r.sofNo}
                            </CardTitle>
                            <SofStatusBadge status={r.status} className="shrink-0 self-start" />
                          </div>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {r.vesselCall?.vessel.name ?? "—"} · {r.vesselCall?.callNo ?? "—"}
                          </p>
                        </div>
                        <p className="mt-auto text-xs text-muted-foreground">
                          Started {formatDt(r.startedAt)} · {r._count?.events ?? 0} events
                        </p>
                      </CardHeader>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {(rows as LighterSofListRow[]).map((r) => (
                <li key={r.id} className="flex min-w-0 flex-col gap-1">
                  <Link
                    href={`/lighter-sof/${r.id}`}
                    prefetch
                    className="block h-full min-h-0 flex-1"
                  >
                    <Card className="h-full transition-colors hover:bg-accent/40">
                      <CardHeader className="flex h-full flex-col gap-3 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <CardTitle className="line-clamp-2 text-base leading-snug">
                              {r.sofNo}
                            </CardTitle>
                            <SofStatusBadge status={r.status} className="shrink-0 self-start" />
                          </div>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            Trip {r.lighterTrip?.tripNo ?? "—"} ·{" "}
                            {r.lighterTrip?.lighterVessel.name ?? "—"} · MV{" "}
                            {r.lighterTrip?.vesselCall?.callNo ?? "—"}
                          </p>
                        </div>
                        <p className="mt-auto text-xs text-muted-foreground">
                          Started {formatDt(r.startedAt)} · {r._count?.events ?? 0} events
                        </p>
                      </CardHeader>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PickerScrollArea>
      </MotherLighterPickerCard>
    </div>
  );
}
