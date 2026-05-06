"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

import { SofDetailPageSkeleton } from "@/components/sof/sof-detail-page-skeleton";

const MotherSofDetailView = dynamic(
  () =>
    import("@/components/sof/detail/mother-sof-detail-view").then((m) => ({
      default: m.MotherSofDetailView
    })),
  { loading: () => <SofDetailPageSkeleton /> }
);

export default function MotherSofDetailPage() {
  const params = useParams();
  const id = params.id as string;
  return <MotherSofDetailView id={id} />;
}
