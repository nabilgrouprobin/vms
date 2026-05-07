"use client";

import { useParams } from "next/navigation";

import { ImportContractLaytimeForm } from "@/components/sof/import-contract-laytime-form";

export default function ImportContractLaytimePage() {
  const params = useParams();
  const id = params.id as string;
  if (!id) return null;
  return <ImportContractLaytimeForm contractId={id} embedded={false} />;
}
