"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MASTER_DATA_EDITOR_ROLES = exports.MASTER_DATA_VIEWER_ROLES = void 0;
const client_1 = require("@prisma/client");
const sof_roles_1 = require("../../sof/constants/sof-roles");
exports.MASTER_DATA_VIEWER_ROLES = sof_roles_1.SOF_VIEWER_ROLES;
exports.MASTER_DATA_EDITOR_ROLES = [
    ...new Set([
        ...sof_roles_1.SOF_EDITOR_ROLES,
        client_1.AppRole.LIGHTER_ASSIGNMENT_OFFICER,
        client_1.AppRole.CARRIER_COORDINATOR,
        client_1.AppRole.COMMERCIAL_ADMIN,
        client_1.AppRole.PORT_ADMIN,
        client_1.AppRole.HEAD_OFFICE_LC
    ])
];
//# sourceMappingURL=master-data-roles.js.map