/**
 * Centralised magic-number limits for repository / service helpers.
 *
 * If you find yourself typing `take: 100` or `take: 500` in a Prisma query,
 * import the named constant from here instead so the value has a name and
 * the rationale lives in one place.
 */

/** Master-data picker dropdowns (locations, organizations, etc.). Returns up to N rows in a single call. */
export const MAX_OPTION_LIST_ROWS = 500;

/** SOF reference-data sub-pickers (event types, sub-resource lists). */
export const MAX_SOF_OPTION_LIST_ROWS = 100;

/** Maximum vessel-call IDs accepted by `dischargeMetricsForVesselCallIds` (perf cap on grouped reads). */
export const MAX_DISCHARGE_METRICS_VESSEL_CALL_IDS = 40;

/** Cap on lighter-trip ghat-aging report rows. */
export const MAX_GHAT_AGING_LIMIT = 500;
