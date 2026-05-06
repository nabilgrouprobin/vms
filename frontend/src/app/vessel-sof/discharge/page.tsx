import { redirect } from "next/navigation";

/** Discharge workspace lives under Reports → Discharge update · cumulative · ghat aging. */
export default function VesselSofDischargePage() {
  redirect("/reports?kind=mother&view=discharge");
}
