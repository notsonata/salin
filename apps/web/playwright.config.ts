import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
  },
  webServer: {
    command: `node ../../node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port ${port}`,
    port,
    reuseExistingServer: false,
  },
});
