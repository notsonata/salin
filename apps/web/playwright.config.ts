import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "node ../../node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3000",
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
