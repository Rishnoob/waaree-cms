import { expect, type Locator, type Page } from "@playwright/test";

/** Type into a rich text field (it becomes a Tiptap editor when clicked), replacing what was there. */
export async function typeRich(page: Page, field: Locator, text: string) {
  await field.getByRole("textbox").first().click();
  await expect(field.locator(".ProseMirror")).toBeVisible();
  await page.keyboard.press("Control+A");
  await page.keyboard.type(text);
}

/** Shared by the CMS tests. Everything a test creates is named "E2E …" so teardown.ts can remove it. */
export const PW = process.env.E2E_PASSWORD ?? "";
export const SHOTS = process.env.E2E_SCREENSHOTS;
export const tag = () => Date.now().toString(36);

export async function shot(page: Page, name: string, fullPage = false) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage });
}

/** Log in and wait until the CMS home has loaded (so no token refresh is cut short by the next navigation). */
export async function login(page: Page, email: string) {
  await page.context().clearCookies();
  await page.goto("/login?next=/cms");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(PW);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/cms(\/)?$/, { timeout: 60_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Pages" })).toBeVisible({ timeout: 30_000 });
}

export const cmsNav = (page: Page) => page.getByRole("navigation", { name: "CMS" });

/** The page’s state as the editor’s top bar says it (“Draft”, “Waiting for approval”, “Live”…). */
export const pageState = (page: Page) => page.getByTestId("page-state");

/** New page from the CMS home (or a card’s “Add a page”), straight into the editor. Returns its URL. */
export async function newPage(page: Page, name: string, opts: { template?: string; where?: string; card?: string } = {}) {
  if (opts.card) {
    await page.getByRole("tab", { name: "Website menu" }).click();
    await page.getByRole("button", { name: `Add a page to ${opts.card}`, exact: true }).click(); // e.g. "Company › Group Business"
  }
  else await page.getByRole("button", { name: "New page" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("e.g. Careers at Waaree").fill(name);
  if (opts.template) await dialog.getByRole("radio", { name: opts.template }).click();
  if (opts.where) await dialog.getByRole("radio", { name: opts.where }).click();
  await dialog.getByRole("button", { name: "Create page" }).click();
  await page.waitForURL(/\/cms\/pages\/\d+/);
  await expect(pageState(page)).toHaveText("Draft");
  return page.url();
}

export async function sendForApproval(page: Page) {
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Send for approval" }).click();
  await expect(pageState(page)).toHaveText("Waiting for approval");
}

export async function approveAndPublish(page: Page, url: string) {
  await page.goto(url);
  await page.getByRole("button", { name: "Approve and publish" }).click();
  await expect(pageState(page)).toHaveText("Live");
}
