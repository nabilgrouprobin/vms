"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

import { SofDetailPageSkeleton } from "@/components/sof/sof-detail-page-skeleton";

const LighterSofDetailView = dynamic(
  () =>
    import("@/components/sof/detail/lighter-sof-detail-view").then((m) => ({
      default: m.LighterSofDetailView
    })),
  { loading: () => <SofDetailPageSkeleton /> }
);

export default function LighterSofDetailPage() {
  const params = useParams();
  const id = params.id as string;
  return <LighterSofDetailView id={id} />;
}
