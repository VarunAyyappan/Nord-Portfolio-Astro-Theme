import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/build/**/*.test.ts"],
    globalSetup: ["test/build/global-setup.ts"],
    // Tests that build a copy of the site run a whole Astro build, several
    // at once across test files, which can outlast the 5s and 10s defaults.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
