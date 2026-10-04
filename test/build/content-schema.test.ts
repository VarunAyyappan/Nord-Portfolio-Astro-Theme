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
import {
  postsDir,
  projectsDir,
  publishedPosts,
  publishedProjects,
} from "./content";

/** What the build is copied without: dependencies and generated files. */
const skipped = new Set([
  ".git",
  ".astro",
  "dist",
  "node_modules",
  "test-results",
]);

/**
 * Builds a copy of the site with one extra content file in `dir`, named
 * broken.md: the filler file `id` with `line` in place of its `field` line.
 * A broken file never touches the real content.
 */
function buildWithBrokenFile(
  dir: string,
  id: string,
  field: string,
  line: string,
) {
  const markdown = readFileSync(path.join(dir, `${id}.md`), "utf8")
    .replace(new RegExp(`^${field}:.*\n`, "m"), "")
    .replace(/^---\n/, `---\n${line}\n`);
  const root = mkdtempSync(path.join(tmpdir(), "nord-theme-"));
  cpSync(process.cwd(), root, {
    recursive: true,
    filter: (source) => !skipped.has(path.basename(source)),
  });
  symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
  const copiedDir = path.join(root, path.relative(process.cwd(), dir));
  writeFileSync(path.join(copiedDir, "broken.md"), markdown);
  const build = spawnSync(path.resolve("node_modules/.bin/astro"), ["build"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, NODE_ENV: "production" },
  });
  return { root, status: build.status, output: build.stdout + build.stderr };
}

/** Expects a build that failed on broken.md's `field`. */
function expectSchemaError(
  build: ReturnType<typeof buildWithBrokenFile>,
  field: string,
) {
  expect(build.status).not.toBe(0);
  expect(build.output).toContain("does not match collection schema");
  expect(build.output).toContain("broken");
  expect(build.output).toMatch(new RegExp(`\\b${field}\\b`));
}

let root: string | undefined;
afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true });
  root = undefined;
});

describe("Project frontmatter", () => {
  it.each([
    ["date", "date: someday"],
    ["repository", "repository: not a url"],
    ["stack", "stack: Rust"],
    ["featured", "featured: sometimes"],
  ])(
    "fails the build, naming the Project and the field, when %s is invalid",
    (field, line) => {
      const [project] = publishedProjects();
      const build = buildWithBrokenFile(projectsDir, project.id, field, line);
      root = build.root;
      expectSchemaError(build, field);
    },
  );
});

describe("Post frontmatter", () => {
  it.each([
    ["date", "date: someday"],
    ["updated", "updated: soon"],
    ["tags", "tags: Algorithms"],
    ["draft", "draft: maybe"],
  ])(
    "fails the build, naming the Post and the field, when %s is invalid",
    (field, line) => {
      const [post] = publishedPosts();
      const build = buildWithBrokenFile(postsDir, post.id, field, line);
      root = build.root;
      expectSchemaError(build, field);
    },
  );
});
