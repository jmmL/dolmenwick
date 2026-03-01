import { defineConfig, devices } from "@playwright/test"

const port = Number(process.env.PLAYWRIGHT_PORT ?? "4173")

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  outputDir: "output/playwright/test-results",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        viewport: { width: 1440, height: 1024 },
      },
    },
    {
      name: "webkit-iphone",
      use: {
        ...devices["iPhone 13"],
        browserName: "webkit",
      },
    },
  ],
  webServer: {
    command: "PATH=/opt/homebrew/opt/node@22/bin:$PATH node scripts/serve-public.mjs",
    port,
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
