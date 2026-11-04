import { expect, test } from "@playwright/test";

import { approveAndPublish, login, newPage, pageState, PW, sendForApproval, shot, tag, typeRich } from "./helpers";

test.describe.configure({ timeout: 240_000 });
test.skip(!PW, "Set E2E_PASSWORD (DEV_SEED_PASSWORD from waaree-apis/.env)");

/**
 * The everyday flow: an editor makes a page by typing on it, sends it for approval; the approver asks
 * for a change; the editor fixes it; the approver approves and publishes; it’s live.
 */
test("make a page by typing on it, get it approved, see it live", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const name = `E2E Why solar ${tag()}`;

  await login(page, "editor@waaree.test");
  await shot(page, "P1-home", true);
  const url = await newPage(page, name, { template: "Blank page" });

  // type straight onto the page
  await page.getByRole("textbox", { name: /one-line introduction/ }).fill("A short guide for homeowners.");
  await page.getByRole("button", { name: "Add the first section" }).click();
  await page.getByRole("button", { name: "Add Big banner" }).click();
  const banner = page.getByRole("group", { name: "Big banner section" });
  await banner.getByRole("textbox", { name: "Headline" }).fill("Power your home with the sun");
  await page.getByRole("button", { name: "Add a section" }).last().click();
  await page.getByRole("button", { name: "Add Paragraph" }).click();
  await typeRich(page, page.getByRole("group", { name: "Paragraph section" }), "Solar is cheaper than ever.");
  await shot(page, "P2-editing", true);
  await sendForApproval(page);

  // the approver finds it under “Needs you” and asks for a change
  await login(page, "approver@waaree.test");
  await page.getByRole("status", { name: "Needs you" }).getByRole("button", { name: /waiting for your approval/ }).click();
  await expect(page.getByRole("tab", { name: /Waiting for approval/ })).toHaveAttribute("aria-selected", "true");
  await shot(page, "P3-filtered", true);
  await page.getByRole("link", { name: new RegExp(name) }).click();
  await page.waitForURL(/\/cms\/pages\/\d+/);
  await expect(page.getByText(/Read it through, then approve and publish/)).toBeVisible();
  await shot(page, "P3-review");
  await page.getByRole("button", { name: "More publishing options" }).click();
  await page.getByRole("menuitem", { name: "Ask for changes…" }).click();
  await page.getByLabel("What needs to change?").fill("Please add a line about net metering.");
  await page.getByRole("button", { name: "Send back" }).click();
  await expect(pageState(page)).toHaveText("Needs changes");

  // the editor sees the note, fixes the text, sends it again
  await login(page, "editor@waaree.test");
  await page.goto(url);
  await expect(page.getByText("Please add a line about net metering.")).toBeVisible();
  await typeRich(page, page.getByRole("group", { name: "Paragraph section" }), "Solar is cheaper than ever. Net metering lets you sell spare power back.");
  await sendForApproval(page);

  // approved and published in one click; it’s on the website
  await login(page, "approver@waaree.test");
  await approveAndPublish(page, url);
  await shot(page, "P4-live");
  const slug = (await page.getByRole("link", { name: "View on website" }).getAttribute("href")) ?? "";
  await page.goto(slug);
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Power your home with the sun" })).toBeVisible();
  await expect(page.getByText("Net metering lets you sell spare power back.")).toBeVisible();

  // it wasn’t put in a menu item, so the website lists it under “More”
  const main = page.getByRole("navigation", { name: "Main" });
  await main.getByRole("button", { name: "More" }).hover();
  await expect(main.getByRole("link", { name })).toBeVisible();
  await shot(page, "P5-more");
});

test("an author can take a page back from review to keep editing", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, "editor@waaree.test");
  await newPage(page, `E2E Take back ${tag()}`);
  await sendForApproval(page);
  await expect(page.getByText("Editing is paused")).toBeVisible();
  await page.getByRole("button", { name: "Take it back to edit" }).click();
  await expect(pageState(page)).toHaveText("Draft");
  await expect(page.getByRole("button", { name: "Send for approval" })).toBeEnabled();
});
