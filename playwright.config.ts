import { defineConfig, devices } from "@playwright/test";
import { siteConfig } from "./src/site.config";

const port = 4321;
const baseURL = `http://localhost:${port}${siteConfig.base.replace(/\/$/, "")}/`;

/** Browser tests run against the preview server serving a production build. */
export default defineConfig({
  testDir: "test/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // --ignore-lock keeps the preview server in the foreground, where
    // Playwright can manage it, even when Astro would background it.
    command: `astro build && astro preview --port ${port} --ignore-lock`,
    url: baseURL,
    reuseExistingServer: false,
  },
});
