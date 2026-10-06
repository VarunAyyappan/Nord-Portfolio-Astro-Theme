import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "node-html-parser";
import { afterEach, describe, expect, it } from "vitest";
import { buildCopy, removeCopy } from "./build-copy";
import {
  educationDir,
  educationSources,
  experienceDir,
  experienceSources,
  postsDir,
  projectsDir,
  publishedPosts,
  publishedProjects,
} from "./content";
import { sectionTitled } from "./output";

/**
 * Builds a copy of the site with one extra content file in `dir`, named
 * broken.md or broken.yaml: the filler file `file` with `line` in place of
 * its `field` line. A broken file never touches the real content.
 */
function buildWithBrokenFile(
  dir: string,
  file: string,
  field: string,
  line: string,
) {
  const extension = path.extname(file);
  const withoutField = readFileSync(path.join(dir, file), "utf8").replace(
    new RegExp(`^${field}:.*\n`, "m"),
    "",
  );
  // Markdown keeps its fields in frontmatter; a data file is all fields.
  const broken =
    extension === ".md"
      ? withoutField.replace(/^---\n/, `---\n${line}\n`)
      : `${line}\n${withoutField}`;
  return buildCopy((root) => {
    const copiedDir = path.join(root, path.relative(process.cwd(), dir));
    writeFileSync(path.join(copiedDir, `broken${extension}`), broken);
  });
}

/** Expects a build that failed on the broken file's `field`. */
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
  if (root) removeCopy(root);
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
      const build = buildWithBrokenFile(
        projectsDir,
        `${project.id}.md`,
        field,
        line,
      );
      root = build.root;
      expectSchemaError(build, field);
    },
  );
});

/**
 * Builds a copy of the site where only new Projects are featured: `published`
 * of them, plus `drafts` featured drafts, each newer than every published
 * one. No filler Project is featured. With `keepDrafts`, the build keeps
 * drafts, as the dev server does.
 */
function buildWithFeatured({
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
  const build = buildCopy(feature, { keepDrafts });
  return { ...build, titles: projects.map(({ title }) => title) };
}

/** The titles of the Projects a copy's Home shows as featured, in order. */
function featuredOnHome(root: string): string[] {
  const home = parse(readFileSync(path.join(root, "dist/index.html"), "utf8"));
  const section = sectionTitled(home, "Featured Projects");
  return (section?.querySelectorAll("article h3") ?? []).map((heading) =>
    heading.textContent.trim(),
  );
}

describe("featured Project limit", () => {
  it("fails the build, naming each featured Project, when more than 3 are published", () => {
    const build = buildWithFeatured({ published: 4, drafts: 0 });
    root = build.root;
    expect(build.status).not.toBe(0);
    expect(build.output).toContain("Up to 3 Projects can be featured");
    for (const title of build.titles) {
      expect(build.output).toContain(title);
    }
  });

  it("doesn't count featured drafts", () => {
    const build = buildWithFeatured({ published: 3, drafts: 1 });
    root = build.root;
    expect(build.output).not.toContain("Up to 3 Projects can be featured");
    expect(build.status).toBe(0);
  });

  it("shows featured drafts, where drafts are kept, only in room the published ones leave", () => {
    const build = buildWithFeatured({
      published: 3,
      drafts: 1,
      keepDrafts: true,
    });
    root = build.root;
    expect(build.status).toBe(0);
    expect(featuredOnHome(build.root)).toEqual([
      "Featured Project 3",
      "Featured Project 2",
      "Featured Project 1",
    ]);
  });

  it("fills the room published ones leave with the newest featured drafts, where drafts are kept", () => {
    const build = buildWithFeatured({
      published: 1,
      drafts: 3,
      keepDrafts: true,
    });
    root = build.root;
    expect(build.status).toBe(0);
    expect(featuredOnHome(build.root)).toEqual([
      "Featured Draft 3",
      "Featured Draft 2",
      "Featured Project 1",
    ]);
  });
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
      const build = buildWithBrokenFile(postsDir, `${post.id}.md`, field, line);
      root = build.root;
      expectSchemaError(build, field);
    },
  );

  // Astro's error names the image but not the Post.
  it("fails the build, naming the image, when cover can't be read", () => {
    const [post] = publishedPosts();
    const build = buildWithBrokenFile(
      postsDir,
      `${post.id}.md`,
      "cover",
      "cover: ./covers/missing.png",
    );
    root = build.root;
    expect(build.status).not.toBe(0);
    expect(build.output).toContain("ImageNotFound");
    expect(build.output).toContain("./covers/missing.png");
  });
});

describe("Experience entry data", () => {
  it.each([
    ["role", "role:"],
    ["start", "start: someday"],
    // YAML reads a bare year as a number, which isn't a month.
    ["start", "start: 2022"],
    ["end", "end: soon"],
    ["stack", "stack: Rust"],
  ])(
    "fails the build, naming the Experience entry and the field, when %s is invalid",
    (field, line) => {
      const [entry] = experienceSources();
      const build = buildWithBrokenFile(
        experienceDir,
        `${entry.id}.yaml`,
        field,
        line,
      );
      root = build.root;
      expectSchemaError(build, field);
    },
  );
});

describe("Education entry data", () => {
  it("fails the build, naming the Education entry and the field, when start is invalid", () => {
    const [entry] = educationSources();
    const build = buildWithBrokenFile(
      educationDir,
      `${entry.id}.yaml`,
      "start",
      "start: someday",
    );
    root = build.root;
    expectSchemaError(build, "start");
  });
});
