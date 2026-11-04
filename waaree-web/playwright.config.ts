import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests. Both apps must be running (pnpm dev + the API), and E2E_PASSWORD must be set
 * to DEV_SEED_PASSWORD from waaree-apis/.env:
 *
 *   E2E_PASSWORD=... pnpm test:e2e
 */
export default defineConfig({
  testDir: "tests/e2e",
  globalTeardown: "./tests/e2e/teardown.ts", // removes the "E2E …" pages, menu items and files the tests made
  fullyParallel: false, // tests share the seeded accounts
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    channel: "chrome", // the locally installed Chrome; no browser download needed
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
