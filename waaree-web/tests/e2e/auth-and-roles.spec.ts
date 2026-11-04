import { expect, test } from "@playwright/test";

import { cmsNav, login, PW, shot } from "./helpers";

test.skip(!PW, "Set E2E_PASSWORD (DEV_SEED_PASSWORD from waaree-apis/.env)");

test("not logged in → sent to the website’s sign-in page; a wrong password shows a clear message", async ({ page }) => {
  await page.goto("/cms");
  await expect(page).toHaveURL(/\/login\?next=%2Fcms/);
  await page.goto("/cms/login"); // old links still work
  await expect(page).toHaveURL(/\/login$/);
  await shot(page, "01-login");
  await page.getByLabel("Work email").fill("editor@waaree.test");
  await page.getByLabel("Password").fill("definitely-wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Email or password is incorrect" })).toBeVisible();
});

test("super admin sees every section, manages roles, and logs out", async ({ page }) => {
  await login(page, "superadmin@waaree.test");
  const nav = cmsNav(page);
  for (const label of ["Pages", "Files", "People", "Activity", "Settings"]) await expect(nav.getByRole("link", { name: label })).toBeVisible();

  await nav.getByRole("link", { name: "People" }).click();
  await expect(page.getByRole("heading", { name: "People", level: 1 })).toBeVisible();
  await expect(page.getByText("editor@waaree.test")).toBeVisible();
  await shot(page, "03-people");

  await page.getByRole("tab", { name: "Roles" }).click();
  await page.getByRole("button", { name: "Edit role Admin" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("See the list of CMS users")).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();

  // create and delete a role end to end
  await page.getByRole("button", { name: "New role" }).click();
  await dialog.getByLabel("Role name").fill("E2E temp role");
  await dialog.getByText("See roles and what each one can do").click();
  await dialog.getByRole("button", { name: "Create role" }).click();
  await page.getByRole("button", { name: "Edit role E2E temp role" }).click();
  await dialog.getByRole("button", { name: "Delete role" }).click();
  await expect(page.getByRole("button", { name: "Edit role E2E temp role" })).toHaveCount(0);

  await page.getByRole("button", { name: /Signed in as/ }).click();
  await page.getByRole("menuitem", { name: /Log out/ }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("an editor doesn’t see admin sections, and the API refuses them", async ({ page }) => {
  await login(page, "editor@waaree.test");
  const nav = cmsNav(page);
  await expect(nav.getByRole("link", { name: "Pages" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "People" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Settings" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "New menu item" })).toHaveCount(0); // menus are for admins

  await page.goto("/cms/team"); // typing the address directly
  await expect(page.getByText("You don't have permission to do this")).toBeVisible();
});

test("on a phone, the CMS sections are labelled tabs", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "superadmin@waaree.test");
  await shot(page, "06-mobile-home", true);
  await cmsNav(page).getByRole("link", { name: "People" }).click();
  await expect(page.getByRole("heading", { name: "People", level: 1 })).toBeVisible();
});

test("sign-in belongs to the whole website: your account shows on every page, and you can sign out anywhere", async ({ page }) => {
  await login(page, "editor@waaree.test");
  await page.goto("/");
  const account = page.getByRole("button", { name: "Signed in as Editor (test)" });
  await expect(account).toBeVisible({ timeout: 30_000 });
  await account.click();
  await expect(page.getByRole("menuitem", { name: /Open the CMS/ })).toBeVisible();
  await shot(page, "11-account-on-site");
  await page.getByRole("menuitem", { name: /Log out/ }).click();
  await expect(page).toHaveURL(/\/$/); // stays on the website
  await expect(account).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Staff sign in" })).toBeVisible();
});
