/**
 * Runtime schemas for the API responses we depend on most heavily.
 *
 * Why only some endpoints? `api<T>(...)` historically casts the parsed JSON to
 * `T` with no runtime check, so a backend rename or removed field silently
 * shows as `undefined` in the UI. We pay the small bundle/parse cost of zod
 * only for the responses where breakage would be hardest to debug:
 *
 *   1. The login/signup response (any drift logs the user out forever).
 *   2. The two SOF "chip peek" payloads used to label the workspace header.
 *   3. The generic `Paginated<T>` envelope every list endpoint returns.
 *
 * Other endpoints keep using the unchecked `api<T>(...)` for now; expand the
 * coverage when a regression bites.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

const userProfileSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  phone: z.string(),
  fullName: z.string(),
  organizationId: z.string().nullable(),
  roles: z.array(z.string())
});

export const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  // Backend currently always emits "Bearer" — keep it as a literal so a
  // backend swap to a different scheme surfaces here instead of silently
  // breaking the `Authorization` header.
  tokenType: z.literal("Bearer"),
  user: userProfileSchema
});

export type LoginResponseSchema = z.infer<typeof loginResponseSchema>;

// ---------------------------------------------------------------------------
// SOF "chip peek" — the small payload the workspace header reads to render
// the breadcrumb-style chip "VesselName · CallNo · SofNo".
// ---------------------------------------------------------------------------

const vesselCallChipSchema = z
  .object({
    vessel: z.object({ name: z.string() }),
    callNo: z.string()
  })
  .nullable();

export const motherSofChipPeekSchema = z.object({
  sofNo: z.string(),
  vesselCall: vesselCallChipSchema
});

export const lighterSofChipPeekSchema = z.object({
  sofNo: z.string(),
  lighterTrip: z
    .object({
      lighterVessel: z.object({ name: z.string() }),
      tripNo: z.string(),
      vesselCall: vesselCallChipSchema
    })
    .nullable()
});

export type MotherSofChipPeekSchema = z.infer<typeof motherSofChipPeekSchema>;
export type LighterSofChipPeekSchema = z.infer<typeof lighterSofChipPeekSchema>;

// ---------------------------------------------------------------------------
// Paginated<T> envelope
// ---------------------------------------------------------------------------

/**
 * Build a schema for a `Paginated<T>` envelope. Mirrors the backend type:
 *
 *   { data: T[]; nextCursor: string | null; limit: number }
 *
 * Use it like:
 *   const productsPageSchema = paginatedSchema(productSchema);
 *   const page = productsPageSchema.parse(json);
 */
export function paginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    nextCursor: z.string().nullable(),
    limit: z.number()
  });
}
