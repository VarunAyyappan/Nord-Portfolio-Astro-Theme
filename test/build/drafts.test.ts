import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { type HTMLElement, parse } from "node-html-parser";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { formatDay, formatMonth } from "../../src/lib/date";
import { buildCopy, type CopyBuild, removeCopy } from "./build-copy";
import { postSources, projectSources } from "./content";

/** A draft as the tests look for it: its title, date and how it's dated. */
interface Draft {
  kind: string;
  title: string;
  date: Date;
  /** The date as a Visitor reads it next to the draft. */
  shownDate: string;
  /** The output file of the draft's own page. */
  page: string;
}

const drafts: Draft[] = [
  ...postSources()
    .filter((post) => post.draft)
    .map((post) => ({
      kind: "Post",
      title: post.title,
      date: post.date,
      shownDate: formatDay(post.date),
      page: `blog/${post.id}/index.html`,
    })),
  ...projectSources()
    .filter((project) => project.draft)
    .map((project) => ({
      kind: "Project",
      title: project.title,
      date: project.date,
      shownDate: formatMonth(project.date),
      page: `projects/${project.id}/index.html`,
    })),
];

/**
 * How the draft is dated on every page of the build that shows it, inside
 * the `<article>` whose heading is its title, keyed by output file: the text
 * of the `<time>` of its date and whatever shares its element, and of the
 * whole line around it.
 */
function datedLines(root: string, { title, date }: Draft) {
  const dist = path.join(root, "dist");
  const pages = readdirSync(dist, { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".html"))
    .toSorted();
  const text = (node: HTMLElement | null) =>
    (node?.textContent ?? "").replace(/\s+/g, " ").trim();
  const lines: Record<string, { date: string; line: string }[]> = {};
  for (const file of pages) {
    const page = parse(readFileSync(path.join(dist, file), "utf8"));
    const found = page
      .querySelectorAll("main article")
      .filter((article) =>
        article
          .querySelectorAll("h1, h2, h3")
          .some((heading) => heading.textContent.trim() === title),
      )
      .flatMap((article) =>
        article.querySelectorAll(`time[datetime="${date.toISOString()}"]`),
      )
      .map((time) => ({
        date: text(time.parentNode),
        line: text(time.closest("p")),
      }));
    if (found.length > 0) lines[file] = found;
  }
  return lines;
}

describe("drafts, where drafts are kept", () => {
  let build: CopyBuild;
  beforeAll(() => {
    build = buildCopy(() => {}, { keepDrafts: true });
  });
  afterAll(() => removeCopy(build.root));

  it("include a draft Post and a draft Project in the filler content", () => {
    expect(drafts.map(({ kind }) => kind).toSorted()).toEqual([
      "Post",
      "Project",
    ]);
  });

  it("build without error", () => {
    expect(build.status).toBe(0);
  });

  it.each(drafts)(
    'show the $kind "$title" with ", draft" right after its date, and no draft badge, everywhere it appears',
    (draft) => {
      const lines = datedLines(build.root, draft);
      // Its own page, and at least one list.
      expect(Object.keys(lines)).toContain(draft.page);
      expect(Object.keys(lines).length).toBeGreaterThan(1);
      for (const [file, found] of Object.entries(lines)) {
        for (const { date, line } of found) {
          expect({ file, date }).toEqual({
            file,
            date: `${draft.shownDate}, draft`,
          });
          // The badge read "Draft", capitalized.
          expect({ file, line }).toEqual({
            file,
            line: expect.not.stringContaining("Draft"),
          });
        }
      }
    },
  );
});
