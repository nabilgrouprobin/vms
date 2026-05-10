/**
 * Helpers for parsing optional numeric form fields.
 *
 * Pattern: a `<input type="number">` is read as a string ("" when empty). The
 * frontend wants to send `null` for empty fields and a `number` for filled
 * ones, with a clear error when the user types nonsense.
 */

/**
 * Parse an optional form-field number.
 *
 * - Returns `null` when the trimmed input is empty.
 * - Returns the parsed number when valid.
 * - Throws `Error("<label> must be a valid number.")` when the input is
 *   non-empty but doesn't parse — call sites typically catch this and pipe
 *   the message into a toast / form error.
 */
export function optNum(s: string, label: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = parseFloat(t);
  if (!Number.isFinite(n)) {
    throw new Error(`${label} must be a valid number.`);
  }
  return n;
}
