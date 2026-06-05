import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
    viewport: {
      width: 820,
      height: 560,
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: "bun run build && bun scripts/serve-build.ts",
    url: "http://127.0.0.1:4173/home.html",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
