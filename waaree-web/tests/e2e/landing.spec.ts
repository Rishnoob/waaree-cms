import { expect, type Page, test } from "@playwright/test";

const SHOTS = process.env.E2E_SCREENSHOTS;

// The story test walks every chapter; the first dev-server compile alone can take ~20s.
test.describe.configure({ timeout: 120_000 });

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

/** Scroll so the story section is at `fraction` of its scrollable length, then let the scrub settle. */
async function scrollStory(page: Page, fraction: number) {
  await page.evaluate((f) => {
    const el = document.getElementById("story")!;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (el.offsetHeight - window.innerHeight) * f, behavior: "instant" });
  }, fraction);
  await page.waitForTimeout(1800);
}

async function goToChapter(page: Page, id: string, offset = 0) {
  await page.evaluate(
    ([id, offset]) => {
      const el = document.getElementById(id as string)!;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + (offset as number), behavior: "instant" });
    },
    [id, offset],
  );
  await page.waitForTimeout(1400);
}

test("homepage story covers every chapter", async ({ page }) => {
  test.setTimeout(240_000); // five acts, seventeen chapters
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Accelerating Global Energy Transition/ })).toBeVisible();
  await expect(page.locator("#story canvas")).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(2500);
  await shot(page, "H01-globe");

  await scrollStory(page, 0.45);
  await shot(page, "H02-turning");
  await scrollStory(page, 0.56); // India turns to us; the end of the hero is the dive into Gujarat
  await expect(page.getByText("It all begins in")).toBeVisible();
  await shot(page, "H03-india");
  await scrollStory(page, 0.85);
  await expect(page.getByText(/one of these panels is about to meet you/i)).toBeVisible();
  await shot(page, "H03b-dive");

  // Inside the panel: rest → layers → inside a cell
  await expect(page.getByRole("heading", { name: /Seven layers/ })).toBeAttached();
  for (const [f, name] of [
    [0.05, "H03c-panel"],
    [0.32, "H03d-layers"],
    [0.74, "H03e-cell"],
  ] as const) {
    await page.evaluate((f) => {
      const el = document.getElementById("inside")!;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + (el.offsetHeight - window.innerHeight) * f, behavior: "instant" });
    }, f);
    await page.waitForTimeout(1800);
    await shot(page, name);
  }

  // How it’s made: the points become each stage in turn
  await goToChapter(page, "journey", 200);
  await expect(page.getByRole("heading", { name: /Every panel begins as sand/ })).toBeVisible();
  await shot(page, "H03f-journey");

  await goToChapter(page, "who-we-are");
  await page.waitForTimeout(1500);
  await expect(page.getByRole("heading", { name: /Started with gauges in 1990/ })).toBeAttached();
  await shot(page, "H04-who-we-are");

  await goToChapter(page, "legacy", 300);
  await expect(page.getByRole("heading", { name: /a nation’s solar backbone/ })).toBeAttached();
  await shot(page, "H05-legacy-start");
  await goToChapter(page, "legacy", 2200);
  await shot(page, "H06-legacy-mid");

  // Factories opens on one panel tile and pulls back to an India made of panels
  await goToChapter(page, "factories", 120);
  await shot(page, "H06b-one-tile");
  await goToChapter(page, "factories-map");
  await page.waitForTimeout(2600); // the zoom-out settles, towers rise
  await shot(page, "H07-factories");
  await page.getByRole("link", { name: /Nagpur Integrated Ingot/ }).first().hover();
  await expect(page.getByText("India’s largest integrated ingot & wafer complex is rising here.").first()).toBeVisible();
  await shot(page, "H08-pin-card");
  await expect(page.getByText("Under construction").first()).toBeVisible(); // the status card on the hologram
  await page.getByRole("link", { name: /Tumb Manufacturing Facility/ }).first().hover();
  await page.waitForTimeout(500);
  await shot(page, "H09-tumb");

  // Why Waaree leads: the capacity towers, then the firsts
  await goToChapter(page, "who-we-are");
  await expect(page.getByRole("heading", { name: /Started with gauges in 1990/ })).toBeAttached();
  await shot(page, "H09b-why");

  // Impact at every level: planet → people → prosperity
  for (const [f, name, label] of [
    [0.15, "H09c-planet", /kept out of the air/],
    [0.52, "H09d-people", /homes’ worth of electricity/],
    [0.88, "H09e-prosperity", /of FY26 revenue earned overseas/],
  ] as const) {
    await page.evaluate((f) => {
      const el = document.getElementById("impact")!;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + (el.offsetHeight - window.innerHeight) * f, behavior: "instant" });
    }, f);
    await page.waitForTimeout(1800);
    await expect(page.getByText(label)).toBeVisible();
    await shot(page, name);
  }

  // Act III: every plant and project, where it stands
  await goToChapter(page, "waaree-now", -60);
  await expect(page.getByRole("heading", { name: /projects rising/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /The 5 biggest of the 12/ })).toBeAttached();
  await shot(page, "H11a-waaree-now");

  await goToChapter(page, "whats-next", -60);
  await expect(page.getByRole("heading", { name: /the whole chain/ })).toBeVisible();
  await shot(page, "H11d-whats-next");

  await goToChapter(page, "growth", 3000);
  await expect(page.getByRole("heading", { name: /Revenue up 9×/ })).toBeVisible();
  await shot(page, "H11b-growth");

  await goToChapter(page, "community", 3000);
  await expect(page.getByRole("heading", { name: /7,500 trees/ })).toBeVisible();
  await shot(page, "H11c-giving-back");

  for (const [id, name] of [
    ["offerings", "H10-offerings"],
    ["manufacturing", "H12-manufacturing"],
    ["impact", "H13-impact"],
    ["newsroom", "H14-newsroom"],
    ["contact", "H15-contact"],
  ] as const) {
    await goToChapter(page, id, -60);
    await shot(page, name);
  }
});

test("a factory pin opens its own page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  // jump the way a visitor does: the story bar’s chapter menu, then on to the map
  await page.getByRole("button", { name: "All chapters" }).click();
  await page.getByRole("banner").getByRole("link", { name: "Factories", exact: true }).click();
  await goToChapter(page, "factories-map");
  await page.waitForTimeout(2600);
  await page.getByRole("link", { name: /Nagpur Integrated Ingot/ }).first().click();
  await expect(page).toHaveURL(/\/factories\/nagpur/, { timeout: 30_000 }); // a cold dev server compiles the route first
  await expect(page.getByRole("heading", { level: 1, name: /Nagpur Integrated Ingot/ })).toBeVisible();
  await expect(page.getByText("~₹6,200 crore", { exact: true })).toBeVisible();
  await shot(page, "F01-nagpur");
  await expect(page.getByText("Nagpur, rising.")).toBeVisible(); // the build-status blueprint (construction)
  await page.getByText("Nagpur, rising.").scrollIntoViewIfNeeded();
  await expect(page.getByRole("slider", { name: /Build timeline for Nagpur/ })).toBeVisible();
  await page.waitForTimeout(2500);
  await shot(page, "F01b-nagpur-model");
  await page.goto("/factories/tumb");
  await page.waitForTimeout(800);
  await shot(page, "F02-tumb");
});

test("homepage works on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Accelerating Global Energy Transition/ })).toBeVisible();
  await page.waitForTimeout(2500);
  await shot(page, "M01-globe");
  await scrollStory(page, 0.95);
  await shot(page, "M01b-india");
  await goToChapter(page, "factories");
  await page.waitForTimeout(2600);
  await shot(page, "M02-factories");
  await goToChapter(page, "legacy", 200);
  await shot(page, "M03-legacy");
});
