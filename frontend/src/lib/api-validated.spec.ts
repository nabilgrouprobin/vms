import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ApiSchemaError, apiValidated } from "./api";

const realFetch = globalThis.fetch;

describe("apiValidated", () => {
  beforeEach(() => {
    // jsdom isn't enabled in this vitest config; simulate localStorage on the
    // global so `getAccessToken()` (which the api wrapper calls) doesn't throw.
    // The api code already guards for `typeof window === "undefined"`, so we
    // just need to keep `window` undefined and let it return null.
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  function mockJsonResponse(body: unknown, init?: { status?: number; ok?: boolean }) {
    const status = init?.status ?? 200;
    globalThis.fetch = vi.fn(async () => {
      return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" }
      });
    }) as unknown as typeof fetch;
  }

  it("returns the parsed value when the response matches the schema", async () => {
    const schema = z.object({ id: z.string(), count: z.number() });
    mockJsonResponse({ id: "x_1", count: 7 });

    const result = await apiValidated("/widgets/x_1", schema);
    expect(result).toEqual({ id: "x_1", count: 7 });
  });

  it("throws ApiSchemaError when the response shape diverges", async () => {
    const schema = z.object({ id: z.string(), count: z.number() });
    mockJsonResponse({ id: "x_1", count: "seven" });

    await expect(apiValidated("/widgets/x_1", schema)).rejects.toBeInstanceOf(ApiSchemaError);
  });

  it("preserves the request path on the thrown ApiSchemaError", async () => {
    const schema = z.object({ id: z.string() });
    mockJsonResponse({});

    try {
      await apiValidated("/widgets/missing", schema);
      throw new Error("expected apiValidated to throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiSchemaError);
      expect((e as ApiSchemaError).path).toBe("/widgets/missing");
    }
  });
});
