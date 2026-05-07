import { MasterVesselCrudPage } from "@/components/master-data/master-vessel-crud-page";

export default function LightersMasterPage() {
  return (
    <MasterVesselCrudPage
      kind="lighter"
      title="Lighter"
      description="Lighter hulls used for trips and lighter SOF. Use Actions → Details for full technical fields. Delete deactivates; Restore re-enables pickers."
    />
  );
}
