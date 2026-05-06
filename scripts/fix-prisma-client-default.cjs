/**
 * @prisma/client ships default.js with `require('.prisma/client/default')`, which Node does
 * not resolve as a relative path (must be `./.prisma/...`). Patch after `prisma generate`.
 */
const fs = require("fs");
const path = require("path");

const target = path.join(__dirname, "..", "node_modules", "@prisma", "client", "default.js");

if (!fs.existsSync(target)) {
  process.exit(0);
}

const broken = "require('.prisma/client/default')";
const src = fs.readFileSync(target, "utf8");

if (!src.includes(broken)) {
  process.exit(0);
}

const patched = src.replace(broken, "require('./.prisma/client/default')");
fs.writeFileSync(target, patched);
