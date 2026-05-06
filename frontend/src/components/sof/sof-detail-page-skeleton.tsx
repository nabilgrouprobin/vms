import { Skeleton } from "@/components/ui/skeleton";

/** Shared placeholder while mother/lighter SOF detail chunks load (dynamic import). */
export function SofDetailPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <Skeleton className="h-10 w-64" />
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-44 w-full" />
      </div>
    </div>
  );
}
