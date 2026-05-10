import { BadRequestException } from "@nestjs/common";

/**
 * Default cap for paginated list endpoints. Master-data resources opt into
 * higher/lower defaults via the `defaultValue` argument. The hard ceiling
 * stays here so a client can never request more than `MAX_PAGE_SIZE` rows.
 */
export const DEFAULT_PAGE_SIZE = 30;
export const MAX_PAGE_SIZE = 100;

/**
 * Parse `?limit=` query strings consistently across services.
 *
 * - Empty/undefined → `defaultValue`
 * - Non-integer or `< 1` → 400 BadRequestException
 * - Anything above `MAX_PAGE_SIZE` is silently clamped
 *
 * Centralised so all list endpoints share the same validation + error
 * message shape.
 */
export function parseLimit(
  raw: string | undefined | null,
  defaultValue: number = DEFAULT_PAGE_SIZE
): number {
  if (raw === undefined || raw === null || raw === "") {
    return Math.min(defaultValue, MAX_PAGE_SIZE);
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new BadRequestException("limit must be a positive integer");
  }
  return Math.min(parsed, MAX_PAGE_SIZE);
}
