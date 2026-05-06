import { MasterVesselCrudPage } from "@/components/master-data/master-vessel-crud-page";

export default function MotherVesselsMasterPage() {
  return (
    <MasterVesselCrudPage
      kind="mother"
      title="Mother vessel"
      description="Mother hulls used for vessel calls and SOF. Use row Actions → Details for full registry (IMO, flag, DWT, dimensions). Delete deactivates the hull; Restore brings it back for pickers."
    />
  );
}
