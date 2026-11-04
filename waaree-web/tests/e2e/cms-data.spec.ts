import path from "node:path";

import { expect, test } from "@playwright/test";

import { cmsNav, login, newPage, PW, shot, tag } from "./helpers";

/**
 * Data (collections): make one from a template or an Excel file, add rows, approval, Trash and
 * history, and show it on a page with the “Data view” block (always the published rows).
 */
test.describe.configure({ timeout: 300_000 });
test.skip(!PW, "Set E2E_PASSWORD (DEV_SEED_PASSWORD from waaree-apis/.env)");

test("quarterly results: make it, add a row, approve it, show it on a page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const name = `E2E Results ${tag()}`;

  // 1 · an admin makes the collection from the ready-made template
  await login(page, "admin@waaree.test");
  await cmsNav(page).getByRole("link", { name: "Data" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Data" })).toBeVisible();
  await page.getByRole("button", { name: "New collection" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("radio", { name: "Quarterly results" }).click();
  await dialog.getByPlaceholder("e.g. Quarterly results").fill(name);
  await shot(page, "D1-new-collection");
  await dialog.getByRole("button", { name: "Create collection" }).click();
  await page.waitForURL(/\/cms\/data\/e2e-results/);
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  const url = page.url();

  // 2 · an editor adds a row and sends it for approval
  await login(page, "editor@waaree.test");
  await page.goto(url);
  await page.getByRole("button", { name: "Add a row" }).click();
  const drawer = page.getByRole("dialog");
  await drawer.getByLabel("Quarter *").fill("Q1 FY26");
  await drawer.getByLabel("Period end *").fill("2025-06-30");
  await drawer.getByLabel("Revenue (₹ crore)").fill("1234.5");
  await drawer.getByRole("button", { name: "Save and send for approval" }).click();
  await expect(drawer.getByText("Waiting for approval. Editing is paused")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("row", { name: /Waiting for approval Q1 FY26/ })).toBeVisible();
  await shot(page, "D2-rows");

  // 3 · the approver publishes it
  await login(page, "approver@waaree.test");
  await page.goto(url);
  await page.getByRole("row", { name: /Q1 FY26/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Approve and publish" }).click();
  await expect(page.getByRole("row", { name: /Live Q1 FY26/ })).toBeVisible();

  // 4 · the editor shows it on a page with a Data view; it reads the live rows
  await login(page, "editor@waaree.test");
  await newPage(page, `E2E Investors ${tag()}`, { template: "Blank page" });
  await page.getByRole("button", { name: "Add the first section" }).click();
  await page.getByRole("textbox", { name: "Find a block" }).fill("data");
  await page.getByRole("button", { name: "Add Data view" }).click();
  await page.getByRole("combobox", { name: "Use existing data" }).click();
  await page.getByRole("option", { name }).click();
  const view = page.getByRole("group", { name: "Data view section" });
  await expect(view.getByRole("cell", { name: "Q1 FY26" })).toBeVisible();
  await expect(view.getByRole("cell", { name: "1,234.5" })).toBeVisible();
  await expect(view.getByRole("cell", { name: "30 Jun 2025" })).toBeVisible();
  await page.getByRole("radio", { name: "Cards" }).click();
  await shot(page, "D3-data-view", true);

  // 5 · safety: Trash hides it everywhere and can be undone; history restores an earlier version
  await page.goto(url);
  await page.getByRole("row", { name: /Q1 FY26/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Move to Trash" }).click();
  await page.getByRole("tab", { name: /Trash/ }).click();
  await page.getByRole("button", { name: "Restore" }).click();
  await page.getByRole("tab", { name: /Rows/ }).click();
  await page.getByRole("row", { name: /Q1 FY26/ }).click();
  await expect(page.getByRole("dialog").getByText("moved it to Trash")).toBeVisible();
  await expect(page.getByRole("dialog").getByText("restored it")).toBeVisible();
  await shot(page, "D4-history");
});

test("make a collection straight from an Excel sheet", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, "admin@waaree.test");
  await page.goto("/cms/data");
  await page.getByRole("button", { name: "New collection" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Excel or CSV file for the new collection").setInputFiles(path.join(__dirname, "fixtures", "plants.xlsx"));
  await expect(dialog.getByText("guessed from your file (3 rows)")).toBeVisible({ timeout: 20_000 });
  await dialog.getByPlaceholder("e.g. Quarterly results").fill(`E2E From Excel ${tag()}`);
  await dialog.getByRole("button", { name: "Create collection" }).click();
  await page.waitForURL(/\/cms\/data\/e2e-from-excel/);
  await expect(page.getByRole("row", { name: /Draft Site survey Done/ })).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(4); // header + 3 rows
  await page.getByRole("tab", { name: /Fields/ }).click();
  await page.getByRole("button", { name: "Hide Status" }).click();
  await expect(page.getByText("hidden (data kept)")).toBeVisible();
  await shot(page, "D5-from-excel", true);
});

test("design first: a carousel card makes its own data; adding to the card adds the field", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const name = `E2E Blog cards ${tag()}`;
  await login(page, "editor@waaree.test");
  await newPage(page, `E2E Blog ${tag()}`, { template: "Blank page" });
  await page.getByRole("button", { name: "Add the first section" }).click();
  await page.getByRole("button", { name: "Add Carousel" }).click();
  const block = page.getByRole("group", { name: "Carousel section" });
  await expect(block.getByText("Design the card on the right")).toBeVisible();
  await shot(page, "C1-design");

  // the data is made from the card: Picture + Title
  await page.getByRole("button", { name: "Make data for this" }).click();
  await page.getByRole("dialog").getByLabel("Name").fill(name);
  await page.getByRole("dialog").getByRole("button", { name: "Make data" }).click();
  await expect(page.getByText(`“${name}” is ready`)).toBeVisible();

  // add an item right here in the page editor
  await page.getByRole("button", { name: "Add an item" }).click();
  await page.getByRole("dialog").getByLabel("Title *").fill("Why rooftop solar pays back");
  await page.getByRole("dialog").getByRole("button", { name: "Save and publish" }).click();
  await expect(block.getByRole("heading", { name: "Why rooftop solar pays back" })).toBeVisible();

  // later: add a description to the card; the field is added to the data
  await page.getByRole("button", { name: "Add to the card" }).click();
  await page.getByRole("menuitem", { name: "Description" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText(/Added “Description” to the card and to/)).toBeVisible();

  // fill it in for the existing item (click the card)
  await block.getByRole("heading", { name: "Why rooftop solar pays back" }).click();
  const drawer = page.getByRole("dialog");
  await drawer.getByRole("textbox", { name: "Type here…" }).click();
  await page.keyboard.type("Most homes recover the cost in a few years.");
  await drawer.getByRole("button", { name: "Save and publish" }).click();
  await expect(block.getByText("Most homes recover the cost in a few years.")).toBeVisible();
  await shot(page, "C2-carousel", true);

  // the data has exactly the card's fields
  await page.goto("/cms/data");
  await page.getByRole("link", { name: new RegExp(name) }).click();
  await page.getByRole("tab", { name: /Fields/ }).click();
  await expect(page.getByRole("tab", { name: "Fields · 3" })).toBeVisible();
  for (const f of ["Picture", "Title", "Description"]) await expect(page.getByRole("listitem").filter({ hasText: new RegExp(`^${f}`) }).first()).toBeVisible();
});
