"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIGHTER_TRIP_EDITOR_ROLES = exports.LIGHTER_TRIP_VIEWER_ROLES = void 0;
const client_1 = require("@prisma/client");
const sof_roles_1 = require("../../sof/constants/sof-roles");
exports.LIGHTER_TRIP_VIEWER_ROLES = sof_roles_1.SOF_VIEWER_ROLES;
exports.LIGHTER_TRIP_EDITOR_ROLES = [
    ...sof_roles_1.SOF_EDITOR_ROLES,
    client_1.AppRole.LIGHTER_ASSIGNMENT_OFFICER
];
//# sourceMappingURL=lighter-trip-roles.js.map