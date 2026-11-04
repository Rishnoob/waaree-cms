import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api/client";

import { fetchSystemStatus } from "./api";

type GetResult = Awaited<ReturnType<typeof api.GET>>;

function mockGet(result: Partial<GetResult> | Error) {
  const spy = vi.spyOn(api, "GET");
  if (result instanceof Error) spy.mockRejectedValue(result);
  else spy.mockResolvedValue(result as GetResult);
}

describe("fetchSystemStatus", () => {
  afterEach(() => vi.restoreAllMocks());

  it("reports ok when API and DB are up", async () => {
    mockGet({
      data: { status: "ok", api: "ok", database: "ok", version: "0.1.0" },
      response: new Response(null, { status: 200 }),
    });
    expect(await fetchSystemStatus()).toEqual({ api: "ok", database: "ok", version: "0.1.0" });
  });

  it("reports DB down on 503", async () => {
    mockGet({ data: undefined, response: new Response(null, { status: 503 }) });
    expect(await fetchSystemStatus()).toEqual({ api: "ok", database: "down", version: null });
  });

  it("reports everything down when the API is unreachable", async () => {
    mockGet(new TypeError("fetch failed"));
    expect(await fetchSystemStatus()).toEqual({ api: "down", database: "down", version: null });
  });
});
