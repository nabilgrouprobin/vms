"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOF_STATUS_FLOW = exports.MAX_SOF_PAGE_SIZE = exports.DEFAULT_SOF_PAGE_SIZE = void 0;
exports.DEFAULT_SOF_PAGE_SIZE = 25;
exports.MAX_SOF_PAGE_SIZE = 100;
exports.SOF_STATUS_FLOW = {
    DRAFT: ["PENDING_VERIFICATION", "DISPUTED", "CLOSED"],
    PENDING_VERIFICATION: ["VERIFIED", "DISPUTED", "DRAFT"],
    VERIFIED: ["APPROVED", "DISPUTED"],
    APPROVED: ["CLOSED", "DISPUTED"],
    DISPUTED: ["DRAFT", "PENDING_VERIFICATION", "VERIFIED", "CLOSED"],
    CLOSED: []
};
//# sourceMappingURL=sof.constants.js.map