import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Integration tests hit the real Supabase project configured in .env.local.
process.loadEnvFile(".env.local");

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    testTimeout: 20_000,
    // Tests share one database; run files one at a time.
    fileParallelism: false,
  },
});
