import { AppRole } from "@prisma/client";

import { SOF_EDITOR_ROLES, SOF_VIEWER_ROLES } from "../../sof/constants/sof-roles";

/** Same visibility as SOF / vessel-call operational data. */
export const MASTER_DATA_VIEWER_ROLES: AppRole[] = SOF_VIEWER_ROLES;

/** Master registry editors: SOF editors plus lighter / port / commercial roles that maintain reference data. */
export const MASTER_DATA_EDITOR_ROLES: AppRole[] = [
  ...new Set<AppRole>([
    ...SOF_EDITOR_ROLES,
    AppRole.LIGHTER_ASSIGNMENT_OFFICER,
    AppRole.CARRIER_COORDINATOR,
    AppRole.COMMERCIAL_ADMIN,
    AppRole.PORT_ADMIN,
    AppRole.HEAD_OFFICE_LC
  ])
];
