import { readFileSync } from "node:fs";
import path from "node:path";
import type { HTMLElement } from "node-html-parser";
import { describe, expect, it } from "vitest";
import { postSources, publishedPosts } from "./content";
import { basePath, outDir, outputFiles, readPage } from "./output";

/** How many Posts each Blog index page lists. */
const pageSize = 10;

/** The titles of the given Post list items, from their headings. */
function listedTitles(posts: HTMLElement[]) {
  return posts.map((post) => post.querySelector("h2, h3")?.textContent.trim());
}

describe("Blog index", () => {
  const published = publishedPosts();
  const firstPage =
    readPage("blog/index.html").querySelectorAll("main article");

  it("has more published Posts than fit on one page", () => {
    expect(published.length).toBeGreaterThan(pageSize);
  });

  it("lists the 10 newest Posts on page 1, newest first", () => {
    expect(listedTitles(firstPage)).toEqual(
      published.slice(0, pageSize).map((post) => post.title),
    );
  });

  it("lists the rest on page 2, newest first", () => {
    const secondPage =
      readPage("blog/2/index.html").querySelectorAll("main article");
    expect(listedTitles(secondPage)).toEqual(
      published.slice(pageSize).map((post) => post.title),
    );
  });

  it("builds no page 3", () => {
    expect(outputFiles().filter((file) => file.startsWith("blog/3/"))).toEqual(
      [],
    );
  });

  it.each([
    ["blog/index.html", { prev: undefined, next: `${basePath}blog/2/` }],
    ["blog/2/index.html", { prev: `${basePath}blog/`, next: undefined }],
  ])("links %s to its previous and next pages", (file, expected) => {
    const page = readPage(file);
    /** The href of the link in main with the given `rel`, if there is one. */
    const linkTo = (rel: string) =>
      page.querySelector(`main a[rel="${rel}"]`)?.getAttribute("href");
    expect({ prev: linkTo("prev"), next: linkTo("next") }).toEqual(expected);
  });
});

/** The reading time a Post page shows, in minutes. */
function readingMinutes(page: HTMLElement): number {
  const match = page.querySelector("main")?.textContent.match(/(\d+) min read/);
  return Number(match?.[1]);
}

describe.each(publishedPosts())("$title Post page", (post) => {
  const page = readPage(`blog/${post.id}/index.html`);
  const header = page.querySelector("main article header");
  /** The `datetime` of each `<time>` in the header, as a date string. */
  const headerDates = () =>
    header
      ?.querySelectorAll("time")
      .map((time) =>
        new Date(time.getAttribute("datetime") ?? "").toISOString(),
      );

  it("shows the title as the page heading", () => {
    expect(page.querySelector("main h1")?.textContent.trim()).toBe(post.title);
  });

  it("renders the Markdown body", () => {
    expect(page.querySelector("main")?.textContent).toContain(
      post.firstParagraph,
    );
  });

  it(`shows the publish date${post.updated ? " and updated date" : ""}`, () => {
    expect(headerDates()).toEqual(
      [post.date, post.updated]
        .filter((date) => date !== undefined)
        .map((date) => date.toISOString()),
    );
  });

  it("shows a reading time", () => {
    expect(readingMinutes(page)).toBeGreaterThanOrEqual(1);
  });

  it("shows its Tags as plain text", () => {
    const tags = header?.querySelector('[aria-label="Tags"]');
    expect(
      tags?.querySelectorAll("li").map((tag) => tag.textContent.trim()),
    ).toEqual(post.tags);
    expect(tags?.querySelectorAll("a")).toEqual([]);
  });
});

describe("reading time", () => {
  it("is longer for a longer Post", () => {
    const byLength = publishedPosts().toSorted(
      (a, b) => a.body.length - b.body.length,
    );
    const minutes = (post: { id: string }) =>
      readingMinutes(readPage(`blog/${post.id}/index.html`));
    expect(minutes(byLength.at(-1) ?? byLength[0])).toBeGreaterThan(
      minutes(byLength[0]),
    );
  });
});

describe("draft Posts", () => {
  const drafts = postSources().filter((post) => post.draft);

  it("exist in the filler content", () => {
    expect(drafts.length).toBeGreaterThan(0);
  });

  it.each(drafts)("leaves out $title everywhere", ({ id, title }) => {
    const mentions = outputFiles()
      .filter((file) => /\.(html|xml|txt|json)$/.test(file))
      .filter((file) => {
        const text = readFileSync(path.join(outDir, file), "utf8");
        return text.includes(title) || text.includes(`/blog/${id}/`);
      });
    expect(mentions).toEqual([]);
    expect(outputFiles().filter((file) => file.includes(id))).toEqual([]);
  });
});

describe("latest Posts on Home", () => {
  const section = readPage("index.html")
    .querySelectorAll("main h2")
    .find((heading) => heading.textContent.trim() === "Latest Posts")
    ?.closest("section");

  it("shows the 3 newest published Posts, newest first", () => {
    expect(listedTitles(section?.querySelectorAll("article") ?? [])).toEqual(
      publishedPosts()
        .slice(0, 3)
        .map((post) => post.title),
    );
  });

  it("links to the Blog", () => {
    const links = section
      ?.querySelectorAll("a")
      .filter((link) => link.textContent.trim() === "All Posts")
      .map((link) => link.getAttribute("href"));
    expect(links).toEqual([`${basePath}blog/`]);
  });
});

describe("code blocks", () => {
  /** The 16 Nord colors, from https://www.nordtheme.com/docs/colors-and-palettes. */
  const nord = [
    ...["#2e3440", "#3b4252", "#434c5e", "#4c566a"],
    ...["#d8dee9", "#e5e9f0", "#eceff4"],
    ...["#8fbcbb", "#88c0d0", "#81a1c1", "#5e81ac"],
    ...["#bf616a", "#d08770", "#ebcb8b", "#a3be8c", "#b48ead"],
  ];
  const blocks = publishedPosts().flatMap((post) =>
    readPage(`blog/${post.id}/index.html`).querySelectorAll("main pre"),
  );
  /** Every color in the inline styles of a code block and its tokens. */
  const colors = (block: HTMLElement) =>
    [block, ...block.querySelectorAll("[style]")].flatMap((element) =>
      [
        ...(element.getAttribute("style") ?? "").matchAll(/#[0-9a-f]{3,8}\b/gi),
      ].map(([color]) => color.toLowerCase()),
    );

  it("exist in the filler content", () => {
    expect(blocks.length).toBeGreaterThan(0);
  });

  it("are dark, with a nord0 background", () => {
    const backgrounds = blocks.map((block) =>
      block
        .getAttribute("style")
        ?.match(/background-color:\s*(#[0-9a-f]+)/i)?.[1]
        .toLowerCase(),
    );
    expect(new Set(backgrounds)).toEqual(new Set(["#2e3440"]));
  });

  it("use only Nord colors", () => {
    const others = blocks
      .flatMap(colors)
      .filter((color) => !nord.includes(color));
    expect([...new Set(others)]).toEqual([]);
  });
});
