import { expect, test } from "@playwright/test";

import { approveAndPublish, cmsNav, login, newPage, pageState, PW, sendForApproval, shot, tag } from "./helpers";

/**
 * The goal of the CMS: make a new menu item, put new pages in it or in Waaree’s own sections, and
 * after approval they appear in the website’s menu. Plus moving a page by dragging it, files,
 * settings and publishing later.
 */
test.describe.configure({ timeout: 300_000 });
test.skip(!PW, "Set E2E_PASSWORD (DEV_SEED_PASSWORD from waaree-apis/.env)");

// a 1x1 green PNG
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

test("new menu item, pages placed in it and in Company, and the website menu follows", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const t = tag();
  const group = `E2E Sustainability ${t}`;

  // 1 · an admin adds a menu item
  await login(page, "admin@waaree.test");
  await page.getByRole("tab", { name: "Website menu" }).click();
  await page.getByRole("button", { name: "New menu item" }).click();
  await page.getByLabel("Name in the menu").fill(group);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("region", { name: group })).toBeVisible();
  await shot(page, "S1-menu-item", true);

  // 2 · the editor adds a page inside it, and one inside Company
  await login(page, "editor@waaree.test");
  const inGroup = await newPage(page, `E2E ESG report ${t}`, { card: group });
  await sendForApproval(page);
  await page.goto("/cms");
  const inCompany = await newPage(page, `E2E Careers ${t}`, { card: "Company › Group Business" });
  await sendForApproval(page);

  // 3 · nothing on the website before approval
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: group })).toHaveCount(0);

  // 4 · the approver publishes both
  await login(page, "approver@waaree.test");
  await approveAndPublish(page, inGroup);
  await approveAndPublish(page, inCompany);

  // 5 · the website menu has the new item with its page, and Company has the new page
  await page.goto("/");
  const main = page.getByRole("navigation", { name: "Main" });
  // on the bar if it has a slot at this width, otherwise under “More”
  await expect(main.getByRole("button", { name: group }).or(main.getByRole("button", { name: "More" })).first()).toBeVisible({ timeout: 30_000 });
  await ((await main.getByRole("button", { name: group }).isVisible()) ? main.getByRole("button", { name: group }) : main.getByRole("button", { name: "More" })).hover();
  await expect(main.getByRole("link", { name: `E2E ESG report ${t}` })).toBeVisible({ timeout: 30_000 });
  await shot(page, "S2-site-group");
  await main.getByRole("button", { name: "Company" }).hover();
  await expect(main.getByRole("link", { name: `E2E Careers ${t}` })).toBeVisible(); // in the Group Business column
  await shot(page, "S2b-site-company");
  await main.getByRole("link", { name: `E2E Careers ${t}` }).click();
  await expect(page.getByRole("heading", { level: 1, name: `E2E Careers ${t}` })).toBeVisible({ timeout: 30_000 });

  // 6 · drag the Careers page from Company › Group Business to Products › PV Modules
  await login(page, "editor@waaree.test");
  await page.getByRole("tab", { name: "Website menu" }).click();
  const careers = page.getByRole("group", { name: "Company › Group Business" }).getByRole("link", { name: new RegExp(`E2E Careers ${t}`) });
  const pv = page.getByRole("group", { name: "Products › PV Modules" });
  await careers.evaluate((el) => el.scrollIntoView({ block: "center" })); // both rows clear of the fixed site navbar
  await careers.dragTo(pv);
  await expect(page.getByRole("group", { name: "Products › PV Modules" }).getByRole("link", { name: new RegExp(`E2E Careers ${t}`) })).toBeVisible();
  await shot(page, "S3-dragged", true);

  // 7 · the list filters by menu item
  await page.getByRole("tab", { name: "All pages" }).click();
  await page.getByRole("combobox", { name: "Menu item" }).click();
  await page.getByRole("option", { name: "In Products (any part)" }).click();
  await expect(page.getByRole("link", { name: new RegExp(`E2E Careers ${t}`) })).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(`E2E ESG report ${t}`) })).toHaveCount(0);
  await shot(page, "S4-filter-menu", true);
});

test("files, settings and publishing later", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const t = tag();
  await login(page, "admin@waaree.test");

  // files
  await cmsNav(page).getByRole("link", { name: "Files" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Files" })).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({ name: `e2e-green-${t}.png`, mimeType: "image/png", buffer: PNG });
  await expect(page.getByText(`e2e-green-${t}.png`).first()).toBeVisible({ timeout: 20_000 });

  // settings: the announcement shows across the website
  await cmsNav(page).getByRole("link", { name: "Settings" }).click();
  await page.getByLabel("Announcement bar").fill(`Q2 results are out ${t}`);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Settings saved")).toBeVisible();
  await page.goto("/");
  await expect(page.getByText(`Q2 results are out ${t}`)).toBeVisible({ timeout: 30_000 });
  await page.goto("/cms/settings");
  await page.getByLabel("Announcement bar").fill("");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Settings saved")).toBeVisible();

  // publish later: approved for tomorrow → not on the website yet
  await login(page, "editor@waaree.test");
  const url = await newPage(page, `E2E Launch ${t}`);
  await sendForApproval(page);
  await login(page, "approver@waaree.test");
  await page.goto(url);
  await page.getByRole("button", { name: "More publishing options" }).click();
  await page.getByRole("menuitem", { name: "Approve and publish later…" }).click();
  const when = new Date(Date.now() + 24 * 3600 * 1000);
  await page.getByLabel("Goes live on").fill(new Date(when.getTime() - when.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  await page.getByRole("button", { name: "Schedule" }).click();
  await expect(pageState(page)).toContainText("Goes live");
  await shot(page, "S5-scheduled");
  await page.goto(`/e2e-launch-${t}`);
  await expect(page.getByRole("heading", { name: "This page isn’t here." })).toBeVisible({ timeout: 30_000 });
});

test("make a new menu item while creating a page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const t = tag();
  const group = `E2E Investors corner ${t}`;
  await login(page, "admin@waaree.test");
  await page.getByRole("button", { name: "New page" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("e.g. Careers at Waaree").fill(`E2E Dividend history ${t}`);
  await dialog.getByRole("button", { name: "New menu item" }).click();
  await dialog.getByLabel("Name of the new menu item").fill(group);
  await dialog.getByLabel("Name of the new menu item").press("Enter");
  await expect(dialog.getByRole("radio", { name: group })).toHaveAttribute("aria-checked", "true");
  await expect(dialog.getByText(`It shows in the website menu under ${group}.`)).toBeVisible();
  await shot(page, "S6-inline-menu-item");
  await dialog.getByRole("button", { name: "Create page" }).click();
  await page.waitForURL(/\/cms\/pages\/\d+/);

  await page.goto("/cms");
  await page.getByRole("tab", { name: "Website menu" }).click();
  await expect(page.getByRole("region", { name: group }).getByRole("link", { name: new RegExp(`E2E Dividend history ${t}`) })).toBeVisible();
  await shot(page, "S7-outline", true);

  // remove it: its page moves to More, nothing is lost
  await page.getByRole("button", { name: `Options for ${group}` }).click();
  await page.getByRole("menuitem", { name: /Remove menu item/ }).click();
  await expect(page.getByRole("dialog").getByText("1 page moves to More")).toBeVisible();
  await shot(page, "S8-remove");
  await page.getByRole("button", { name: "Remove menu item" }).click();
  await expect(page.getByRole("region", { name: group })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "More", exact: true }).getByRole("link", { name: new RegExp(`E2E Dividend history ${t}`) })).toBeVisible();

  // an empty menu item offers “Remove” right where it says it’s empty
  const empty = `E2E Empty ${t}`;
  await page.getByRole("button", { name: "New menu item" }).click();
  await page.getByLabel("Name in the menu").fill(empty);
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("region", { name: empty }).getByRole("button", { name: "Remove this menu item" }).click();
  await expect(page.getByRole("dialog").getByText("It’s empty, so nothing else changes.")).toBeVisible();
  await page.getByRole("button", { name: "Remove menu item" }).click();
  await expect(page.getByRole("region", { name: empty })).toHaveCount(0);
});
