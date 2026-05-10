import { describe, expect, it } from "vitest";

import {
  lighterSofChipPeekSchema,
  loginResponseSchema,
  motherSofChipPeekSchema,
  paginatedSchema
} from "./api-schemas";
import { z } from "zod";

describe("api-schemas", () => {
  describe("loginResponseSchema", () => {
    it("accepts a well-formed login payload", () => {
      const ok = loginResponseSchema.safeParse({
        accessToken: "jwt.payload.signature",
        tokenType: "Bearer",
        user: {
          id: "u_1",
          email: null,
          phone: "+8801555550000",
          fullName: "Test User",
          organizationId: null,
          roles: ["admin"]
        }
      });
      expect(ok.success).toBe(true);
    });

    it("rejects a missing user field (caught at runtime, not silently typed)", () => {
      const bad = loginResponseSchema.safeParse({
        accessToken: "jwt",
        tokenType: "Bearer",
        user: { id: "u_1", email: null, phone: "+88", fullName: "X", organizationId: null }
      });
      expect(bad.success).toBe(false);
    });

    it("rejects an unexpected tokenType", () => {
      const bad = loginResponseSchema.safeParse({
        accessToken: "jwt",
        tokenType: "Basic",
        user: {
          id: "u_1",
          email: null,
          phone: "+88",
          fullName: "X",
          organizationId: null,
          roles: []
        }
      });
      expect(bad.success).toBe(false);
    });
  });

  describe("motherSofChipPeekSchema", () => {
    it("accepts a SOF with a vessel call", () => {
      const ok = motherSofChipPeekSchema.safeParse({
        sofNo: "SOF-001",
        vesselCall: { vessel: { name: "MV Alpha" }, callNo: "C-2026-001" }
      });
      expect(ok.success).toBe(true);
    });

    it("accepts a SOF with no vessel call (null is allowed)", () => {
      const ok = motherSofChipPeekSchema.safeParse({ sofNo: "SOF-001", vesselCall: null });
      expect(ok.success).toBe(true);
    });
  });

  describe("lighterSofChipPeekSchema", () => {
    it("accepts a SOF whose lighter trip lacks a vessel call", () => {
      const ok = lighterSofChipPeekSchema.safeParse({
        sofNo: "SOF-LTR-001",
        lighterTrip: {
          lighterVessel: { name: "L-1" },
          tripNo: "T-2026-001",
          vesselCall: null
        }
      });
      expect(ok.success).toBe(true);
    });
  });

  describe("paginatedSchema", () => {
    const productSchema = z.object({ id: z.string(), name: z.string() });
    const productsPage = paginatedSchema(productSchema);

    it("accepts an empty page", () => {
      const ok = productsPage.safeParse({ data: [], nextCursor: null, limit: 24 });
      expect(ok.success).toBe(true);
    });

    it("accepts a populated page with a cursor", () => {
      const ok = productsPage.safeParse({
        data: [{ id: "p_1", name: "Wheat" }],
        nextCursor: "p_24",
        limit: 24
      });
      expect(ok.success).toBe(true);
    });

    it("rejects a row missing a required field", () => {
      const bad = productsPage.safeParse({
        data: [{ id: "p_1" }],
        nextCursor: null,
        limit: 24
      });
      expect(bad.success).toBe(false);
    });
  });
});
