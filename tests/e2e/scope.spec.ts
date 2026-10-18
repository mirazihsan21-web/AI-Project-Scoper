import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { hashIp } from "../../src/lib/db/rate-limit";

const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const createdScopeIds: string[] = [];

test.afterAll(async () => {
  if (createdScopeIds.length) await db.from("scopes").delete().in("id", createdScopeIds);
  // The local Next.js server reports the browser as the loopback address.
  const salt = process.env.IP_HASH_SALT!;
  await db
    .from("scope_requests")
    .delete()
    .in("ip_hash", ["::1", "127.0.0.1", "unknown"].map((ip) => hashIp(ip, salt)));
});

test("turns a sample brief into a shareable scope page", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "a WhatsApp chat" }).click();
  await expect(page.getByLabel("Your project brief")).toHaveValue(/FitZone/);

  await page.getByRole("button", { name: "Scope my project" }).click();

  await page.waitForURL(/\/s\/[0-9a-f-]{36}$/);
  createdScopeIds.push(page.url().split("/s/")[1]);
  await expect(page.getByRole("heading", { level: 1, name: "Gym Class Booking App" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "First version" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Must have" })).toBeVisible();
  await expect(page.getByText(/\$\d{1,3}(,\d{3})*–\$\d/).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Delivery plan" })).toBeVisible();

  // Must-haves get a highlighter sweep on arrival; once it finishes, every one must be fully marked.
  // Scope to the article: Next keeps the previous page (with its preview highlights) hidden in the DOM.
  const sizes = await page.locator("article .highlight-must").evaluateAll(async (els) => {
    await Promise.all(document.getAnimations().map((a) => a.finished));
    return els.map((el) => getComputedStyle(el).backgroundSize);
  });
  expect(sizes.length).toBe(4);
  expect(new Set(sizes)).toEqual(new Set(["100% 100%"]));

  await page.screenshot({ path: `test-results/screens/${testInfo.project.name}-scope.png`, fullPage: true });

  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download PDF" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("gym-class-booking-app-scope.pdf");
  const bytes = await readFile(await file.path());
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  expect(bytes.length).toBeGreaterThan(10_000);
});

test("returns 404 for the PDF of a scope that doesn't exist", async ({ request }) => {
  const response = await request.get("/api/scope/00000000-0000-4000-8000-000000000000/pdf");
  expect(response.status()).toBe(404);
});

test("asks for more detail when the brief is too short", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByLabel("Your project brief").fill("need an app");
  await page.getByRole("button", { name: "Scope my project" }).click();

  // Next.js renders its own empty role="alert" route announcer, so match our message by text.
  await expect(page.getByRole("alert").filter({ hasText: "Add a bit more detail: at least 20 characters." })).toBeVisible();
  await expect(page.getByLabel("Your project brief")).toHaveAttribute("aria-invalid", "true");
  await expect(page).toHaveURL("/");
  await page.screenshot({ path: `test-results/screens/${testInfo.project.name}-home.png`, fullPage: true });
});

test("shows a clear page for a scope link that doesn't exist", async ({ page }) => {
  await page.goto("/s/00000000-0000-4000-8000-000000000000");
  await expect(page.getByRole("heading", { name: "This scope doesn't exist" })).toBeVisible();
});
