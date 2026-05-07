"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allocateUniqueCode = allocateUniqueCode;
const node_crypto_1 = require("node:crypto");
async function allocateUniqueCode(exists, prefix) {
    for (let i = 0; i < 32; i++) {
        const code = `${prefix}-${(0, node_crypto_1.randomBytes)(4).toString("hex").toUpperCase()}`;
        if (!(await exists(code)))
            return code;
    }
    throw new Error(`Could not allocate a unique code for prefix ${prefix}`);
}
//# sourceMappingURL=master-code.util.js.map