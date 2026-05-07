"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOF_EDITOR_ROLES = exports.SOF_VIEWER_ROLES = void 0;
const client_1 = require("@prisma/client");
exports.SOF_VIEWER_ROLES = [
    client_1.AppRole.SUPER_ADMIN,
    client_1.AppRole.SYSTEM_ADMIN,
    client_1.AppRole.HEAD_OFFICE_LC,
    client_1.AppRole.COMMERCIAL_ADMIN,
    client_1.AppRole.APPROVAL_ADMIN,
    client_1.AppRole.INTEGRATION_ADMIN,
    client_1.AppRole.OPERATIONS_MANAGER,
    client_1.AppRole.MOTHER_VESSEL_ADMIN,
    client_1.AppRole.MANAGEMENT_VIEWER,
    client_1.AppRole.AUDITOR,
    client_1.AppRole.REPORT_VIEWER,
    client_1.AppRole.DOCUMENT_CONTROLLER,
    client_1.AppRole.COST_ACCOUNTANT,
    client_1.AppRole.FINANCE_APPROVER,
    client_1.AppRole.LIGHTER_ASSIGNMENT_OFFICER,
    client_1.AppRole.CARRIER_COORDINATOR,
    client_1.AppRole.PORT_ADMIN,
    client_1.AppRole.SHIPPING_AGENT_USER,
    client_1.AppRole.CNF_AGENT,
    client_1.AppRole.STEVEDORE_COORDINATOR,
    client_1.AppRole.GHAT_OPERATOR,
    client_1.AppRole.QUALITY_CONTROLLER,
    client_1.AppRole.WEIGHMENT_OFFICER,
    client_1.AppRole.TRUCK_DISPATCH_OFFICER,
    client_1.AppRole.SECURITY_GATE,
    client_1.AppRole.WAREHOUSE_OPERATOR,
    client_1.AppRole.WAREHOUSE_RECEIVER,
    client_1.AppRole.INVENTORY_CONTROLLER,
    client_1.AppRole.SALES_COORDINATOR,
    client_1.AppRole.SURVEYOR
];
exports.SOF_EDITOR_ROLES = [
    client_1.AppRole.SUPER_ADMIN,
    client_1.AppRole.SYSTEM_ADMIN,
    client_1.AppRole.OPERATIONS_MANAGER,
    client_1.AppRole.MOTHER_VESSEL_ADMIN
];
//# sourceMappingURL=sof-roles.js.map