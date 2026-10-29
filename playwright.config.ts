import { type AddressInfo, createServer } from "node:net";
import { defineConfig, devices } from "@playwright/test";
import { siteConfig } from "./src/site.config";

/** A port nothing is listening on, as the system hands it out. */
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on("error", reject);
    server.listen(0, "localhost", () => {
      const { port } = server.address() as AddressInfo;
      server.close(() => resolve(port));
    });
  });
}

// Outside CI, the preview server takes a free port, so a run never collides
// with a dev server or another run. Playwright loads this file again in each
// worker, so the port is chosen once and handed on through the environment.
// Set E2E_PORT to choose one yourself.
process.env.E2E_PORT ??= String(process.env.CI ? 4321 : await freePort());
const port = Number(process.env.E2E_PORT);
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
