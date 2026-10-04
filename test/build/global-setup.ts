import { execFileSync } from "node:child_process";
import path from "node:path";

/** Runs one production build that every build-output test then reads. */
export default function setup() {
  execFileSync(path.resolve("node_modules/.bin/astro"), ["build"], {
    stdio: "inherit",
    // Vitest sets NODE_ENV to "test", which would make the build a
    // non-production one that keeps drafts.
    env: { ...process.env, NODE_ENV: "production" },
  });
}
