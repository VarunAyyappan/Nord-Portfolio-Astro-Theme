import { readFileSync } from "node:fs";
import path from "node:path";
import type { HTMLElement } from "node-html-parser";
import { describe, expect, it } from "vitest";
import { projectSources, publishedProjects } from "./content";
import {
  basePath,
  imageUrls,
  outDir,
  outputFiles,
  readPage,
  unchangedCopies,
} from "./output";

/** The `datetime` of every `<time>` in the given elements, as timestamps. */
function times(elements: HTMLElement[]) {
  return elements.map((element) =>
    Date.parse(element.querySelector("time")?.getAttribute("datetime") ?? ""),
  );
}

/** Expects the given cards to be dated, newest first. */
function expectNewestFirst(cards: HTMLElement[]) {
  const dates = times(cards);
  expect(dates.every(Number.isFinite)).toBe(true);
  expect(dates).toEqual(dates.toSorted((a, b) => b - a));
}

describe("Projects index", () => {
  const index = readPage("projects/index.html");
  const cards = index.querySelectorAll("main article");

  it("lists every published Project", () => {
    const titles = cards.map((card) =>
      card.querySelector("h2")?.textContent.trim(),
    );
    expect(titles.toSorted()).toEqual(
      publishedProjects()
        .map((project) => project.title)
        .toSorted(),
    );
  });

  it("lists Projects newest first", () => {
    expectNewestFirst(cards);
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
  const section = home
    .querySelectorAll("main h2")
    .find((heading) => heading.textContent.trim() === "Featured Projects")
    ?.closest("section");
  const cards = section?.querySelectorAll("article") ?? [];
  const shown = cards.map((card) =>
    card.querySelector("h3")?.textContent.trim(),
  );
  const featured = publishedProjects().filter((project) => project.featured);

  it("shows up to 3 featured Projects", () => {
    expect(featured.length).toBeGreaterThan(0);
    expect(shown).toHaveLength(Math.min(featured.length, 3));
  });

  it("shows only published featured Projects", () => {
    const featuredTitles = featured.map((project) => project.title);
    expect(
      shown.filter((title) => !featuredTitles.includes(title ?? "")),
    ).toEqual([]);
  });

  it("shows them newest first", () => {
    expectNewestFirst(cards);
  });

  it("leaves out only featured Projects older than the ones it shows", () => {
    const oldestShown = Math.min(...times(cards));
    const newerLeftOut = featured.filter(
      (project) =>
        !shown.includes(project.title) && project.date.valueOf() > oldestShown,
    );
    expect(newerLeftOut).toEqual([]);
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
  const indexCards = readPage("projects/index.html").querySelectorAll(
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
    const card = indexCards.find(
      (article) =>
        article.querySelector("h2")?.textContent.trim() === project.title,
    );
    const detailImages = readPage(
      `projects/${project.id}/index.html`,
    ).querySelectorAll("main img");
    const cardImages = card?.querySelectorAll("img") ?? [];

    it(`shows ${project.cover ? "an optimized" : "no"} cover on its card and detail page`, () => {
      const expected = project.cover ? 1 : 0;
      expect(cardImages).toHaveLength(expected);
      expect(detailImages).toHaveLength(expected);
      for (const url of imageUrls([...cardImages, ...detailImages])) {
        expect(url).toMatch(new RegExp(`^${basePath}_astro/.+\\.webp$`));
      }
    });
  });
});
