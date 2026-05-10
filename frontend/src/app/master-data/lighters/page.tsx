import { MasterVesselCrudPage } from "@/components/master-data/master-vessel-crud-page";

export default function LightersMasterPage() {
  return (
    <MasterVesselCrudPage
      kind="lighter"
      title="Lighter"
      description="Lighter hull registry used for trips and lighter SOF. Port visits are managed under Vessel calls → Lighter. Use Actions → Details for full technical fields. Delete deactivates; Restore re-enables pickers."
    />
  );
}
