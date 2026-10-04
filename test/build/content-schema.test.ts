import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { projectsDir, publishedProjects } from "./content";

/** What the build is copied without: dependencies and generated files. */
const skipped = new Set([
  ".git",
  ".astro",
  "dist",
  "node_modules",
  "test-results",
]);

/** A filler Project's Markdown, with `line` in place of its `field` line. */
function brokenProject(field: string, line: string): string {
  const [project] = publishedProjects();
  const source = readFileSync(
    path.join(projectsDir, `${project.id}.md`),
    "utf8",
  );
  return source
    .replace(new RegExp(`^${field}:.*\n`, "m"), "")
    .replace(/^---\n/, `---\n${line}\n`);
}

/**
 * Builds a copy of the site with one extra Project file, so a broken Project
 * never touches the real content.
 */
function buildWithProject(markdown: string) {
  const root = mkdtempSync(path.join(tmpdir(), "nord-theme-"));
  cpSync(process.cwd(), root, {
    recursive: true,
    filter: (source) => !skipped.has(path.basename(source)),
  });
  symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
  const copiedProjectsDir = path.join(
    root,
    path.relative(process.cwd(), projectsDir),
  );
  writeFileSync(path.join(copiedProjectsDir, "broken.md"), markdown);
  const build = spawnSync(path.resolve("node_modules/.bin/astro"), ["build"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, NODE_ENV: "production" },
  });
  return { root, status: build.status, output: build.stdout + build.stderr };
}

describe("Project frontmatter", () => {
  let root: string | undefined;
  afterEach(() => {
    if (root) rmSync(root, { recursive: true, force: true });
  });

  it.each([
    ["date", "date: someday"],
    ["repository", "repository: not a url"],
    ["stack", "stack: Rust"],
    ["featured", "featured: sometimes"],
  ])(
    "fails the build, naming the Project and the field, when %s is invalid",
    (field, line) => {
      const build = buildWithProject(brokenProject(field, line));
      root = build.root;
      expect(build.status).not.toBe(0);
      expect(build.output).toContain("does not match collection schema");
      expect(build.output).toContain("broken");
      expect(build.output).toMatch(new RegExp(`\\b${field}\\b`));
    },
  );
});
