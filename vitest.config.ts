import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/build/**/*.test.ts"],
    globalSetup: ["test/build/global-setup.ts"],
  },
});
