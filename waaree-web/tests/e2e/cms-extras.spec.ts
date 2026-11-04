import { expect, test } from "@playwright/test";

import { login, newPage, PW, shot, tag } from "./helpers";

test.describe.configure({ timeout: 180_000 });
test.skip(!PW, "Set E2E_PASSWORD (DEV_SEED_PASSWORD from waaree-apis/.env)");

test("templates, Ctrl K search and the activity log", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const name = `E2E Rooftop solar ${tag()}`;
  await login(page, "admin@waaree.test");

  // a page started from a template already has its sections
  await newPage(page, name, { template: "Product page" });
  await expect(page.getByRole("group", { name: "Heading section" }).first().getByRole("textbox")).toHaveText("Highlights");
  await expect(page.getByRole("group", { name: "Table section" })).toBeVisible();

  // Ctrl K finds the page and screens
  await page.keyboard.press("Control+k");
  await page.getByLabel("Search pages and screens").fill("rooftop");
  await expect(page.getByRole("option").filter({ hasText: name }).first()).toBeVisible();
  await shot(page, "X-search");
  await page.getByLabel("Search pages and screens").fill("activity");
  await page.keyboard.press("Enter");

  // the activity log shows the new page and exports
  await expect(page.getByRole("heading", { level: 1, name: "Activity" })).toBeVisible();
  await expect(page.getByRole("link", { name }).first()).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect((await download).suggestedFilename()).toMatch(/waaree-audit-.*\.csv/);
});
