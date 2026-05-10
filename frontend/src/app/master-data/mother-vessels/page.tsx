import { MasterVesselCrudPage } from "@/components/master-data/master-vessel-crud-page";

export default function MotherVesselsMasterPage() {
  return (
    <MasterVesselCrudPage
      kind="mother"
      title="Mother vessel"
      description="Mother hulls used for vessel calls and SOF. A hull alone does not appear in operational pickers until you add a port visit: use the Vessel calls screen (main menu). Delete deactivates the hull; Restore brings it back."
    />
  );
}
