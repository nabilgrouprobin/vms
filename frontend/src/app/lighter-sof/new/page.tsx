import { Suspense } from "react";

import { NewVesselSofPage } from "@/components/sof/new-vessel-sof-page";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewLighterSofPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-96 max-w-lg" />}>
      <NewVesselSofPage variant="lighter" />
    </Suspense>
  );
}
