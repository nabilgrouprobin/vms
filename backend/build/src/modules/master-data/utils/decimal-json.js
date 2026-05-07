"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decString = decString;
exports.toDecimalOrNull = toDecimalOrNull;
const client_1 = require("@prisma/client");
function decString(v) {
    if (v === null || v === undefined) {
        return null;
    }
    return v.toString();
}
function toDecimalOrNull(v) {
    if (v === undefined) {
        return undefined;
    }
    if (v === null) {
        return null;
    }
    return new client_1.Prisma.Decimal(v);
}
//# sourceMappingURL=decimal-json.js.map