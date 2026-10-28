import { readFileSync } from "node:fs";
import path from "node:path";
import type { HTMLElement } from "node-html-parser";
import { describe, expect, it } from "vitest";
import { formatMonth } from "../../src/lib/date";
import {
  type ProjectSource,
  projectSources,
  publishedProjects,
} from "./content";
import {
  basePath,
  imageUrls,
  outDir,
  outputFiles,
  readPage,
  sectionTitled,
  sitePath,
  unchangedCopies,
} from "./output";

/** The `datetime` of every `<time>` in the given elements, as timestamps. */
function times(elements: HTMLElement[]) {
  return elements.map((element) =>
    Date.parse(element.querySelector("time")?.getAttribute("datetime") ?? ""),
  );
}

/** Expects the given tiles to be dated, newest first. */
function expectNewestFirst(tiles: HTMLElement[]) {
  const dates = times(tiles);
  expect(dates.every(Number.isFinite)).toBe(true);
  expect(dates).toEqual(dates.toSorted((a, b) => b - a));
}

/** The text of an element, with its white space collapsed. */
const text = (element: HTMLElement | null | undefined) =>
  (element?.textContent ?? "").replace(/\s+/g, " ").trim();

/**
 * Expects each tile to show its Project as one link to the Project's page,
 * with the title, summary, month and Stack.
 */
function expectTiles(tiles: HTMLElement[], projects: ProjectSource[]) {
  const byTitle = (a: { title: string }, b: { title: string }) =>
    a.title.localeCompare(b.title);
  const shown = tiles.map((tile) => ({
    title: text(tile.querySelector("h2, h3")),
    links: tile.querySelectorAll("a").map((link) => link.getAttribute("href")),
    summary: text(tile.querySelector("p")),
    month: text(tile.querySelector("time")),
    stack: tile
      .querySelectorAll('[aria-label="Stack"] li')
      .map((item) => text(item)),
  }));
  expect(shown.toSorted(byTitle)).toEqual(
    projects
      .map((project) => ({
        title: project.title,
        links: [sitePath(`/projects/${project.id}/`)],
        summary: project.summary,
        month: formatMonth(project.date),
        stack: project.stack,
      }))
      .toSorted(byTitle),
  );
}

describe("Projects index", () => {
  const index = readPage("projects/index.html");
  const tiles = index.querySelectorAll("main article");

  it("lists every published Project", () => {
    const titles = tiles.map((tile) =>
      tile.querySelector("h2")?.textContent.trim(),
    );
    expect(titles.toSorted()).toEqual(
      publishedProjects()
        .map((project) => project.title)
        .toSorted(),
    );
  });

  it("lists Projects newest first", () => {
    expectNewestFirst(tiles);
  });

  it("shows each Project as one link, with its title, summary, month and Stack", () => {
    expectTiles(tiles, publishedProjects());
  });
});

describe("draft Projects", () => {
  const drafts = projectSources().filter((project) => project.draft);

  it("exist in the filler content", () => {
    expect(drafts.length).toBeGreaterThan(0);
  });

  it.each(drafts)("leaves out $title everywhere", ({ id, title }) => {
    const mentions = outputFiles()
      .filter((file) => /\.(html|xml|txt|json)$/.test(file))
      .filter((file) => {
        const text = readFileSync(path.join(outDir, file), "utf8");
        return text.includes(title) || text.includes(`/projects/${id}/`);
      });
    expect(mentions).toEqual([]);
    expect(outputFiles().filter((file) => file.includes(id))).toEqual([]);
  });
});

describe.each(publishedProjects())("$title detail page", (project) => {
  const page = readPage(`projects/${project.id}/index.html`);
  /** The hrefs of the links in main whose text is exactly `text`. */
  const linksNamed = (text: string) =>
    page
      .querySelectorAll("main a")
      .filter((link) => link.textContent.trim() === text)
      .map((link) => link.getAttribute("href"));

  it("shows the title as the page heading", () => {
    expect(page.querySelector("main h1")?.textContent.trim()).toBe(
      project.title,
    );
  });

  it("renders the Markdown body", () => {
    expect(page.querySelector("main")?.textContent).toContain(
      project.firstParagraph,
    );
  });

  it("links the repository only when it's set", () => {
    expect(linksNamed("Repository")).toEqual(
      project.repository ? [project.repository] : [],
    );
  });

  it("links the live site only when it's set", () => {
    expect(linksNamed("Live site")).toEqual(project.live ? [project.live] : []);
  });
});

describe("featured Projects on Home", () => {
  const home = readPage("index.html");
  const section = sectionTitled(home, "Featured Projects");
  const tiles = section?.querySelectorAll("article") ?? [];
  const shown = tiles.map((tile) =>
    tile.querySelector("h3")?.textContent.trim(),
  );
  const featured = publishedProjects().filter((project) => project.featured);

  it("exist in the filler content, 4 of them, beside one that isn't featured", () => {
    expect(featured).toHaveLength(4);
    expect(publishedProjects().some((project) => !project.featured)).toBe(true);
  });

  it("shows every published featured Project, and no other", () => {
    expect(shown.toSorted()).toEqual(
      featured.map((project) => project.title).toSorted(),
    );
  });

  it("shows them newest first", () => {
    expectNewestFirst(tiles);
  });

  it("shows each one as one link, with its title, summary, month and Stack, as the Projects index does", () => {
    expectTiles(tiles, featured);
  });

  it("links to every Project", () => {
    const links = section
      ?.querySelectorAll("a")
      .filter((link) => link.textContent.trim() === "All Projects")
      .map((link) => link.getAttribute("href"));
    expect(links).toEqual([`${basePath}projects/`]);
  });
});

describe("Project cover images", () => {
  const withCovers = publishedProjects().filter((project) => project.cover);
  const indexTiles = readPage("projects/index.html").querySelectorAll(
    "main article",
  );

  it("exist in the filler content", () => {
    expect(withCovers.length).toBeGreaterThan(0);
  });

  it("are never copied to the output unchanged", () => {
    expect(
      unchangedCopies(withCovers.map((project) => project.cover ?? "")),
    ).toEqual([]);
  });

  describe.each(publishedProjects())("$title", (project) => {
    const tile = indexTiles.find(
      (article) =>
        article.querySelector("h2")?.textContent.trim() === project.title,
    );
    const detailImages = readPage(
      `projects/${project.id}/index.html`,
    ).querySelectorAll("main img");
    const tileImages = tile?.querySelectorAll("img") ?? [];

    it(`shows ${project.cover ? "an optimized" : "no"} cover on its tile and detail page`, () => {
      const expected = project.cover ? 1 : 0;
      expect(tileImages).toHaveLength(expected);
      expect(detailImages).toHaveLength(expected);
      for (const url of imageUrls([...tileImages, ...detailImages])) {
        expect(url).toMatch(new RegExp(`^${basePath}_astro/.+\\.webp$`));
      }
    });
  });
});
