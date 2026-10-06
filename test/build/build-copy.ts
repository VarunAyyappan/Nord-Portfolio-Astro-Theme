import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/** What the build is copied without: dependencies and generated files. */
const skipped = new Set([
  ".git",
  ".astro",
  "dist",
  "node_modules",
  "test-results",
]);

/** The result of building a copy of the site. */
export interface CopyBuild {
  /** The copy's root directory. Pass it to `removeCopy` when done. */
  root: string;
  /** The build's exit status. */
  status: number | null;
  /** Everything the build printed. */
  output: string;
}

/**
 * Builds a copy of the site after `change` edits it, given the copy's root
 * directory. The real site is never touched.
 */
export function buildCopy(change: (root: string) => void): CopyBuild {
  const root = mkdtempSync(path.join(tmpdir(), "nord-theme-"));
  cpSync(process.cwd(), root, {
    recursive: true,
    filter: (source) => !skipped.has(path.basename(source)),
  });
  // Links each package rather than the whole node_modules, leaving out its
  // dot-directories: Astro and Vite cache there (.astro holds the content
  // data store, .vite the optimized deps), and copies built at the same time
  // would read and overwrite each other's caches.
  mkdirSync(path.join(root, "node_modules"));
  for (const entry of readdirSync("node_modules")) {
    if (entry.startsWith(".")) continue;
    symlinkSync(
      path.resolve("node_modules", entry),
      path.join(root, "node_modules", entry),
    );
  }
  change(root);
  const build = spawnSync(path.resolve("node_modules/.bin/astro"), ["build"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, NODE_ENV: "production" },
  });
  return { root, status: build.status, output: build.stdout + build.stderr };
}

/** Deletes a copy made by `buildCopy`. */
export function removeCopy(root: string) {
  rmSync(root, { recursive: true, force: true });
}
