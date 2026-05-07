import { redirect } from "next/navigation";

export default function LegacyMotherVesselReportsPage() {
  redirect("/reports?kind=mother");
}
