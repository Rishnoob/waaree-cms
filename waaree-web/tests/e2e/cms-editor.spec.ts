import path from "node:path";

import { expect, type Locator, type Page, test } from "@playwright/test";

import { login, newPage, PW, shot, tag, typeRich } from "./helpers";

/**
 * The editor’s “paid CMS” features: rich text (Tiptap) on the page, drag and drop, sections from
 * files (Excel, CSV, Word), pasting cells from Excel, undo/redo and the phone preview.
 */
test.describe.configure({ timeout: 240_000 });
test.skip(!PW, "Set E2E_PASSWORD (DEV_SEED_PASSWORD from waaree-apis/.env)");

const fixture = (name: string) => path.join(__dirname, "fixtures", name);

/** Drag like a person: press, move in small steps (the drag library needs real movement), release. */
async function drag(page: Page, from: Locator, to: Locator, at: { x: number; y: number }) {
  await from.scrollIntoViewIfNeeded();
  const a = (await from.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 10, a.y + a.height / 2 + 10, { steps: 4 });
  const b = (await to.boundingBox())!;
  await page.mouse.move(b.x + at.x, b.y + at.y, { steps: 20 });
  await page.mouse.up();
}

async function blankPage(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, "editor@waaree.test");
  await newPage(page, `E2E Editor ${tag()}`, { template: "Blank page" });
}

test("rich text on the page: format bar for bold, links and lists", async ({ page }) => {
  await blankPage(page);
  await page.getByRole("button", { name: "Add the first section" }).click();
  await page.getByRole("button", { name: "Add Paragraph" }).click();
  const para = page.getByRole("group", { name: "Paragraph section" });
  await typeRich(page, para, "Waaree makes solar modules");

  await page.keyboard.press("Control+A");
  await page.getByRole("button", { name: "Bold" }).click();
  await expect(para.locator("strong")).toHaveText("Waaree makes solar modules");

  await page.getByRole("button", { name: "Link", exact: true }).click();
  await page.getByLabel("Link to").fill("/careers");
  await page.getByRole("button", { name: "Apply link" }).click();
  await expect(para.locator('a[href="/careers"]')).toBeVisible();
  await page.getByRole("button", { name: "Bulleted list" }).click();
  await expect(para.locator("ul li")).toHaveCount(1);
  await shot(page, "E1-rich-text");
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
});

test("drag a block in from the gallery, drag a section to reorder, undo and redo", async ({ page }) => {
  await blankPage(page);
  await page.getByRole("button", { name: "Add the first section" }).click();
  await page.getByRole("button", { name: "Add Heading" }).click();
  await page.getByRole("button", { name: "Close" }).click();

  // drag “Table” from the gallery onto the page, below the heading
  const heading = page.getByRole("group", { name: "Heading section" });
  await drag(page, page.getByRole("button", { name: "Add Table" }), heading, { x: 200, y: 60 });
  await expect(page.getByRole("group", { name: "Table section" })).toBeVisible();
  const order = () => page.locator("[data-block-index] > [role=group]").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  await expect.poll(order).toEqual(["Heading section", "Table section"]);

  // drag the table above the heading by its handle
  await page.getByRole("group", { name: "Table section" }).hover();
  await drag(page, page.getByRole("button", { name: "Drag Table to move it" }), heading, { x: 200, y: 4 });
  await expect.poll(order).toEqual(["Table section", "Heading section"]);
  await shot(page, "E2-dragged", true);

  // undo puts it back; redo moves it again
  await page.getByRole("button", { name: "Undo (Ctrl Z)" }).click();
  await expect.poll(order).toEqual(["Heading section", "Table section"]);
  await page.getByRole("button", { name: "Redo (Ctrl Shift Z)" }).click();
  await expect.poll(order).toEqual(["Table section", "Heading section"]);
});

test("sections from files: Excel and CSV become tables, Word becomes headings, text and tables", async ({ page }) => {
  await blankPage(page);
  await page.getByRole("button", { name: "Add the first section" }).click();
  await page.getByLabel("Files to turn into sections").setInputFiles([fixture("capacity.csv"), fixture("plants.xlsx")]);
  const tables = page.getByRole("group", { name: "Table section" });
  await expect(tables).toHaveCount(2, { timeout: 20_000 });
  await expect(tables.first().getByText("25.8 GW")).toBeVisible();
  await expect(tables.nth(1).getByText("Site survey")).toBeVisible();

  await page.getByRole("button", { name: "Add a section" }).last().click();
  await page.getByLabel("Files to turn into sections").setInputFiles(fixture("report.docx"));
  await expect(page.getByRole("group", { name: "Heading section" }).getByText("Our sustainability report")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("group", { name: "Paragraph section" }).locator("strong", { hasText: "clean energy goals." })).toBeVisible();
  await expect(tables).toHaveCount(3);
  await expect(page.getByText("Step one")).toBeVisible();
  await shot(page, "E3-from-files", true);
});

test("tables: import a file into a table, and paste cells copied from Excel", async ({ page }) => {
  await blankPage(page);
  await page.getByRole("button", { name: "Add the first section" }).click();
  await page.getByRole("button", { name: "Add Table" }).click();
  await page.getByLabel("Excel or CSV file").setInputFiles(fixture("plants.xlsx"));
  const table = page.getByRole("group", { name: "Table section" });
  await expect(table.getByText("Site survey")).toBeVisible({ timeout: 20_000 });

  // paste a 2×2 block from Excel into the first body cell
  const cell = table.locator("td").first();
  await cell.click();
  await cell.evaluate((el) => {
    const dt = new DataTransfer();
    dt.setData("text/plain", "Inverter\t5 kW\nBattery\t10 kWh\n");
    el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  await expect(table.getByText("Inverter")).toBeVisible();
  await expect(table.getByText("10 kWh")).toBeVisible();
});

test("preview at phone width shows the phone layout", async ({ page }) => {
  await blankPage(page);
  await page.getByRole("button", { name: "Add the first section" }).click();
  await page.getByRole("button", { name: "Add Columns" }).click();
  await page.getByRole("radio", { name: "Preview on phone" }).click();
  const frame = page.locator("[data-device]");
  await expect(frame).toHaveAttribute("data-device", "phone");
  await expect.poll(() => frame.evaluate((el) => el.getBoundingClientRect().width)).toBeLessThan(420);
  // on a phone the three columns stack
  const cols = page.getByRole("group", { name: "Columns section" }).locator("h3");
  await expect.poll(async () => ((await cols.nth(1).boundingBox())?.y ?? 0) - ((await cols.nth(0).boundingBox())?.y ?? 0)).toBeGreaterThan(20);
  await shot(page, "E4-phone");
});

test("adding a section from the panel scrolls the page to it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, "editor@waaree.test");
  await newPage(page, `E2E Scroll ${tag()}`, { template: "Product page" }); // a long page
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Add Call to action" }).click(); // added at the end, far below
  const added = page.getByRole("group", { name: "Call to action section" });
  await expect(added).toBeInViewport();
  await shot(page, "E5-scrolled");
});
