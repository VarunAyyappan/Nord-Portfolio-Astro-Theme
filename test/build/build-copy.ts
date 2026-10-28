import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { stripVTControlCharacters } from "node:util";
import { projectsDir } from "./content";

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
  /** Everything the build printed, as plain text without terminal colors. */
  output: string;
}

/**
 * Builds a copy of the site after `change` edits it, given the copy's root
 * directory. The real site is never touched. With `keepDrafts`, the build
 * keeps drafts, as the dev server does.
 */
export function buildCopy(
  change: (root: string) => void,
  { keepDrafts = false }: { keepDrafts?: boolean } = {},
): CopyBuild {
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
  // Vitest sets Vite's import.meta.env values in process.env, which the
  // build would read in place of its own: BASE_URL "/" drops the base path,
  // and PROD "" keeps drafts.
  const {
    BASE_URL: _baseUrl,
    MODE: _mode,
    DEV: _dev,
    PROD: _prod,
    SSR: _ssr,
    ...env
  } = process.env;
  const build = spawnSync(path.resolve("node_modules/.bin/astro"), ["build"], {
    cwd: root,
    encoding: "utf8",
    // A non-production build keeps drafts.
    env: { ...env, NODE_ENV: keepDrafts ? "development" : "production" },
  });
  // Astro colors its output when a CI variable is set, which puts escape
  // codes inside the text that tests match against.
  const output = stripVTControlCharacters(build.stdout + build.stderr);
  return { root, status: build.status, output };
}

/** Deletes a copy made by `buildCopy`. */
export function removeCopy(root: string) {
  rmSync(root, { recursive: true, force: true });
}

/**
 * Builds a copy of the site where only new Projects are featured: `published`
 * of them, plus `drafts` featured drafts, each newer than every published
 * one. No filler Project is featured. With `keepDrafts`, the build keeps
 * drafts, as the dev server does.
 */
export function buildWithFeatured({
  published,
  drafts,
  keepDrafts = false,
}: {
  published: number;
  drafts: number;
  keepDrafts?: boolean;
}) {
  const projects = [
    ...Array.from({ length: published }, (_, i) => ({
      title: `Featured Project ${i + 1}`,
      draft: false,
    })),
    ...Array.from({ length: drafts }, (_, i) => ({
      title: `Featured Draft ${i + 1}`,
      draft: true,
    })),
  ];
  const feature = (root: string) => {
    const copiedDir = path.join(
      root,
      path.relative(process.cwd(), projectsDir),
    );
    for (const file of readdirSync(copiedDir)) {
      if (!file.endsWith(".md")) continue;
      const source = readFileSync(path.join(copiedDir, file), "utf8");
      writeFileSync(
        path.join(copiedDir, file),
        source.replace(/^featured:.*\n/m, ""),
      );
    }
    projects.forEach(({ title, draft }, i) => {
      const frontmatter = [
        `title: ${title}`,
        "summary: A featured Project.",
        `date: 2026-01-${String(i + 1).padStart(2, "0")}`,
        "stack: [Astro]",
        "featured: true",
        `draft: ${draft}`,
      ];
      writeFileSync(
        path.join(copiedDir, `featured-${i + 1}.md`),
        `---\n${frontmatter.join("\n")}\n---\n\nLorem ipsum.\n`,
      );
    });
  };
  return buildCopy(feature, { keepDrafts });
}
