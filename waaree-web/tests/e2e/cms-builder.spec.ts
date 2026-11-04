import { expect, test } from "@playwright/test";

import { cmsNav, login, newPage, PW, shot, tag } from "./helpers";

test.describe.configure({ timeout: 240_000 });
test.skip(!PW, "Set E2E_PASSWORD (DEV_SEED_PASSWORD from waaree-apis/.env)");

test("new blocks: a table you type into, buttons, a look, and formatted text", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, "editor@waaree.test");
  await newPage(page, `E2E Blocks ${tag()}`, { template: "Blank page" });

  await page.getByRole("button", { name: "Add the first section" }).click();
  await page.getByRole("button", { name: "Add Table" }).click();
  const table = page.getByRole("group", { name: "Table section" });
  await table.getByRole("textbox").nth(3).fill("Bi-55-540");
  await page.getByRole("button", { name: "Add a column" }).click();
  await expect(table.getByRole("row").first().getByRole("textbox")).toHaveCount(4);

  await page.getByRole("button", { name: "Add a section" }).last().click();
  await page.getByRole("button", { name: "Add Call to action" }).click();
  await page.getByRole("tab", { name: "Look" }).click();
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(page.getByRole("radio", { name: "Dark" })).toHaveAttribute("aria-checked", "true");

  await page.getByRole("button", { name: "Add a section" }).last().click();
  await page.getByRole("textbox", { name: "Find a block" }).fill("para");
  await page.getByRole("button", { name: "Add Paragraph" }).click();
  await page.getByRole("group", { name: "Paragraph section" }).getByRole("textbox").click();
  await page.keyboard.type("Made in India");
  await page.keyboard.press("Shift+Home");
  await page.getByRole("button", { name: "Bold" }).click();
  await expect(page.getByRole("group", { name: "Paragraph section" }).locator("b, strong")).toHaveText("Made in India");
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await shot(page, "B1-blocks", true);
});

test("custom blocks: build one in the UI Kit, add it to a page in one click", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const name = `E2E Talk to sales ${tag()}`;
  await login(page, "editor@waaree.test");
  await cmsNav(page).getByRole("link", { name: "UI Kit" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "UI Kit" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Table" })).toBeVisible();
  await shot(page, "B2-ui-kit", true);

  await page.getByRole("button", { name: "New custom block" }).first().click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Create and build it" }).click();
  await page.waitForURL(/\/cms\/ui-kit\/\d+/);
  await page.getByRole("button", { name: "Add the first section" }).click();
  await page.getByRole("button", { name: "Add Call to action" }).click();
  await page.getByRole("group", { name: "Call to action section" }).getByRole("textbox", { name: "Headline" }).fill("Talk to our sales team");
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await shot(page, "B3-custom-block");
  await page.getByRole("link", { name: "Done" }).click();
  await page.getByRole("tab", { name: /Your blocks/ }).click();
  await expect(page.getByRole("link", { name: new RegExp(name) })).toBeVisible();

  await page.goto("/cms");
  await newPage(page, `E2E Uses a custom block ${tag()}`, { template: "Blank page" });
  await page.getByRole("button", { name: "Add the first section" }).click();
  await page.getByRole("button", { name: `Add ${name}` }).click();
  await expect(page.getByRole("group", { name: "Call to action section" }).getByRole("textbox", { name: "Headline" })).toHaveText("Talk to our sales team");
});
