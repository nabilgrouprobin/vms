// Re-exported from the shared lib so master-data modules keep their familiar
// import path while non-master-data modules can import from `lib/decimal-json`.
export { decString, toDecimalOrNull, toRequiredDecimal } from "../../../lib/decimal-json";
