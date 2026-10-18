import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import { hashIp } from "../../src/lib/db/rate-limit";

const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const createdScopeIds: string[] = [];

test.afterAll(async () => {
  if (createdScopeIds.length) await db.from("scopes").delete().in("id", createdScopeIds);
  const salt = process.env.IP_HASH_SALT!;
  await db
    .from("scope_requests")
    .delete()
    .in("ip_hash", ["::1", "127.0.0.1", "unknown"].map((ip) => hashIp(ip, salt)));
});

const BRIEF = "We need a booking app for a small yoga studio with class packs and reminders.";

async function createScope(page: Page) {
  await page.goto("/");
  await page.getByLabel("Your project brief").fill(BRIEF);
  await page.getByRole("button", { name: "Scope my project" }).click();
  await page.waitForURL(/\/s\/[0-9a-f-]{36}$/);
  const id = page.url().split("/s/")[1];
  createdScopeIds.push(id);
  return id;
}

async function expectNoAccessibilityViolations(page: Page) {
  // Next 16 keeps the previous page hidden in the DOM; scan only what is on screen.
  const { violations } = await new AxeBuilder({ page }).exclude("[hidden]").analyze();
  expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
}

test.describe("security", () => {
  test("sends security headers", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-powered-by"]).toBeUndefined();
  });
});

for (const [path, body] of [
  ["/api/scope", { brief: BRIEF }],
  ["/api/leads", { scopeId: "00000000-0000-4000-8000-000000000000", name: "A", email: "a@example.com" }],
] as const) {
  test(`refuses a text/plain post to ${path}, which a cross-site form could send`, async ({ request }) => {
    const response = await request.post(path, {
      headers: { "content-type": "text/plain" },
      data: JSON.stringify(body),
    });
    expect(response.status()).toBe(415);
  });
}

test.describe("error messages", () => {
  for (const [label, status, error] of [
    ["the injection guard rejects the brief", 422, "Your brief includes text that reads like instructions to the AI."],
    ["the visitor hits the hourly limit", 429, "You've reached this hour's limit for new scopes. Try again in about 12 minutes."],
    ["every model is busy", 503, "Scoper is busy right now. Try again in 30 seconds."],
    ["the server fails", 500, "Something went wrong on our side. Try again in a minute."],
  ] as const) {
    test(`shows the server's message when ${label}`, async ({ page }) => {
      await page.route("**/api/scope", (route) => route.fulfill({ status, json: { error } }));
      await page.goto("/");
      await page.getByLabel("Your project brief").fill(BRIEF);
      await page.getByRole("button", { name: "Scope my project" }).click();

      await expect(page.getByRole("alert").filter({ hasText: error })).toBeVisible();
      await expect(page.getByRole("button", { name: "Scope my project" })).toBeEnabled();
      await expect(page.getByLabel("Your project brief")).toHaveValue(BRIEF);
    });
  }

  test("explains a dropped connection", async ({ page }) => {
    await page.route("**/api/scope", (route) => route.abort("connectionreset"));
    await page.goto("/");
    await page.getByLabel("Your project brief").fill(BRIEF);
    await page.getByRole("button", { name: "Scope my project" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "Couldn't reach Scoper." })).toBeVisible();
  });

  test("shows the lead form's error and keeps what the visitor typed", async ({ page }) => {
    await createScope(page);
    await page.route("**/api/leads", (route) =>
      route.fulfill({ status: 429, json: { error: "We already have call requests for this scope, so we'll be in touch soon." } }),
    );
    await page.getByLabel("Name", { exact: true }).fill("Ada");
    await page.getByLabel("Email", { exact: true }).fill("ada@example.com");
    await page.getByRole("button", { name: "Book a call" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "We already have call requests" })).toBeVisible();
    await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Ada");
  });
});

test.describe("accessibility", () => {
  test("home, scope and not-found pages have no axe violations", async ({ page }) => {
    await page.goto("/");
    await expectNoAccessibilityViolations(page);

    await createScope(page);
    await expect(page.getByRole("heading", { name: "Delivery plan" })).toBeVisible();
    await expectNoAccessibilityViolations(page);

    await page.goto("/s/00000000-0000-4000-8000-000000000000");
    await expectNoAccessibilityViolations(page);
  });

  test("a keyboard-only visitor can scope a brief", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab"); // logo link
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Your project brief")).toBeFocused();
    await page.keyboard.type(BRIEF);

    await page.keyboard.press("Tab"); // first sample
    await expect(page.getByRole("button", { name: "WhatsApp chat" })).toBeFocused();
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);
    expect(outline).toBe("solid");

    for (let i = 0; i < 3; i++) await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Scope my project" })).toBeFocused();
    await page.keyboard.press("Enter");

    await page.waitForURL(/\/s\/[0-9a-f-]{36}$/);
    createdScopeIds.push(page.url().split("/s/")[1]);
  });
});

test.describe("small screens", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("nothing scrolls sideways at 320px wide", async ({ page }) => {
    const overflow = () =>
      page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

    await page.goto("/");
    expect(await overflow()).toBe(0);

    await createScope(page);
    await expect(page.getByRole("heading", { name: "Delivery plan" })).toBeVisible();
    expect(await overflow()).toBe(0);
  });
});

test("serves the same PDF bytes on repeat downloads (rendered once, then cached)", async ({ page, request }) => {
  const id = await createScope(page);
  const first = await (await request.get(`/api/scope/${id}/pdf`)).body();
  // react-pdf stamps a creation time (to the second) into every render; wait past it so a re-render would differ.
  await page.waitForTimeout(1100);
  const second = await (await request.get(`/api/scope/${id}/pdf`)).body();
  expect(second.equals(first)).toBe(true);
});
