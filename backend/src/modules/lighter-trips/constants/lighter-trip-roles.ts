import { AppRole } from "@prisma/client";

import { SOF_EDITOR_ROLES, SOF_VIEWER_ROLES } from "../../sof/constants/sof-roles";

/** Who can list / read lighter trip operational data */
export const LIGHTER_TRIP_VIEWER_ROLES = SOF_VIEWER_ROLES;

/** Who can update trip milestones / status / remarks */
export const LIGHTER_TRIP_EDITOR_ROLES: AppRole[] = [
  ...SOF_EDITOR_ROLES,
  AppRole.LIGHTER_ASSIGNMENT_OFFICER
];
