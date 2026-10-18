import { defineConfig, devices } from "@playwright/test";

// e2e runs the real app against the real Supabase project, with the fake LLM so no Groq quota is used.
process.loadEnvFile(".env.local");

const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // A production build: it is what Vercel runs, and unlike `next dev` it can run while a developer's own
  // dev server is open in the same folder (Next 16 refuses a second dev server).
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 240_000,
    // Real env vars win over .env.local in Next.js, so these override it for the test server only.
    env: { SCOPER_FAKE_LLM: "1", SCOPER_FAKE_EMAIL: "1", SCOPE_LIMIT_PER_HOUR: "1000" },
  },
});
