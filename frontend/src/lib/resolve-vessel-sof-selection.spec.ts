import { describe, expect, it } from "vitest";

import {
  filterLighterSofsForPortCall,
  resolveMotherSofIdForVesselCall
} from "./resolve-vessel-sof-selection";
import type { LighterSofListRow, MotherSofListRow } from "@/types/vms";

describe("resolve-vessel-sof-selection", () => {
  it("picks mother SOF only for the requested call", () => {
    const rows = [
      {
        id: "sof-yasa",
        sofNo: "Y1",
        vesselCall: { id: "call-yasa", callNo: "Y", vessel: { id: "v1", name: "YASA" } }
      },
      {
        id: "sof-anthia",
        sofNo: "A1",
        vesselCall: { id: "call-anthia", callNo: "A", vessel: { id: "v2", name: "ANTHIA" } }
      }
    ] as MotherSofListRow[];

    expect(resolveMotherSofIdForVesselCall("call-anthia", rows)).toBe("sof-anthia");
    expect(resolveMotherSofIdForVesselCall("call-missing", rows)).toBeNull();
    expect(resolveMotherSofIdForVesselCall("call-missing", [rows[0]!])).toBeNull();
  });

  it("filters lighter SOFs by port call", () => {
    const rows = [
      {
        id: "l1",
        sofNo: "L1",
        lighterTrip: {
          id: "t1",
          tripNo: "1",
          lighterPortCallId: "lc-a",
          vesselCall: { id: "mc", callNo: "M", vessel: { id: "mv", name: "M" } },
          lighterVessel: { id: "hv", name: "H", imoNo: null }
        }
      }
    ] as LighterSofListRow[];

    expect(filterLighterSofsForPortCall("lc-a", rows)).toHaveLength(1);
    expect(filterLighterSofsForPortCall("lc-b", rows)).toHaveLength(0);
  });
});
