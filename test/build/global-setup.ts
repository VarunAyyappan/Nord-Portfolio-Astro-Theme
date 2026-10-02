import { execFileSync } from "node:child_process";
import path from "node:path";

/** Runs one production build that every build-output test then reads. */
export default function setup() {
  execFileSync(path.resolve("node_modules/.bin/astro"), ["build"], {
    stdio: "inherit",
  });
}
