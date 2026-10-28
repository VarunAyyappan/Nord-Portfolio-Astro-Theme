import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  blockHolding,
  box,
  expectAbove,
  expectNoBoxes,
  expectNoHorizontalScroll,
  expectNoOverflow,
  expectRuleAbove,
  expectSpans,
  expectWithin,
  pageGrid,
} from "./layout";
import { viewports } from "./matrix";

const [phone, desktop] = viewports;

/**
 * Posts and Projects share one page layout. Each page here is a Post or a
 * Project from the filler content: its path, its summary (a Project's) or
 * description (a Post's), the start of the first paragraph of its text,
 * and whether it has a cover that leads the text.
 */
const detailPages = [
  {
    name: "a Project with a cover",
    path: "./projects/analytical-engine-notes/",
    summary:
      "Annotated notes on a general-purpose mechanical computer, with interactive diagrams.",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod",
    cover: true,
  },
  {
    name: "a Project without a cover",
    path: "./projects/difference-engine-simulator/",
    summary:
      "A command-line simulator that tabulates polynomials by the method of differences.",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce ac",
    cover: false,
  },
  {
    name: "a Post with a cover",
    path: "./blog/notes-on-note-g/",
    summary:
      "Walking through the first published algorithm, one operation at a time.",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod",
    cover: true,
  },
  {
    name: "a Post without a cover",
    path: "./blog/on-bernoulli-numbers/",
    summary: "Why this sequence makes a good first program.",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod",
    cover: false,
  },
];

/** The parts of a Post or Project page that the layout places. */
function parts(page: Page, { summary, text }: (typeof detailPages)[number]) {
  const article = page.getByRole("main").getByRole("article");
  const date = page.locator("time");
  const firstParagraph = page.getByText(text);
  // The details column holds the date and the text column the text, and
  // neither holds the other's.
  const details = blockHolding(article, date, firstParagraph);
  return {
    title: article.getByRole("heading", { level: 1 }),
    summary: article.getByText(summary, { exact: true }),
    cover: article.locator("img"),
    details,
    firstParagraph: article.getByText(text),
    text: blockHolding(article, firstParagraph, date),
    /** The block under the details' thin rule, which holds their links. */
    links: blockHolding(details, page.getByRole("link"), date),
  };
}

for (const detailPage of detailPages) {
  test.describe(`The page of ${detailPage.name}`, () => {
    test("sets the title above the details and the text, with the details to the left of the text, at desktop width", async ({
      page,
    }) => {
      await page.setViewportSize(desktop);
      await page.goto(detailPage.path);
      const grid = await pageGrid(page);
      const { title, summary, cover, details, firstParagraph, text } = parts(
        page,
        detailPage,
      );

      await expectWithin(title, grid, 1, 12);
      await expectNoOverflow(title);
      await expectSpans(summary, grid, 5, 12);
      await expectAbove(title, summary);

      await expectSpans(details, grid, 1, 3);
      await expectSpans(text, grid, 5, 12);
      await expectAbove(summary, details);
      await expectAbove(summary, text);
      expect(Math.round((await box(details)).top)).toBe(
        Math.round((await box(text)).top),
      );
      await expectRuleAbove(details, "thick");
      await expectRuleAbove(text, "thick");

      if (detailPage.cover) {
        await expectSpans(cover, grid, 5, 12);
        await expectAbove(cover, firstParagraph);
      } else {
        await expect(text.locator("img")).toHaveCount(0);
      }
    });

    test(`stacks in one column as title, summary, ${detailPage.cover ? "cover, " : ""}details, then text, at phone width`, async ({
      page,
    }) => {
      await page.setViewportSize(phone);
      await page.goto(detailPage.path);
      const grid = await pageGrid(page);
      const { title, summary, cover, details, firstParagraph } = parts(
        page,
        detailPage,
      );

      const inOrder = [
        title,
        summary,
        ...(detailPage.cover ? [cover] : []),
        details,
        firstParagraph,
      ];
      // The title wraps at about 16 characters; everything under it spans
      // the full width, so none of it is squeezed into a single column.
      await expectWithin(title, grid, 1, 12);
      for (const part of inOrder.slice(1)) {
        await expectSpans(part, grid, 1, 12);
      }
      for (let i = 1; i < inOrder.length; i++) {
        await expectAbove(inOrder[i - 1], inOrder[i]);
      }
      await expectNoOverflow(title);
      await expectRuleAbove(details, "thick");
      await expectNoHorizontalScroll(page);
    });
  });
}

/** The lines of text an element renders, top to bottom, as a Visitor reads them. */
const renderedLines = (locator: Locator) =>
  locator.evaluate((element) =>
    (element as HTMLElement).innerText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  );

test.describe("A Project's details", () => {
  test("give its month, then its Stack one item per line under a Stack heading, then its links below a thin rule, all as plain text", async ({
    page,
  }) => {
    await page.setViewportSize(desktop);
    await page.goto("./projects/analytical-engine-notes/");
    const { details, links: linksBlock } = parts(page, detailPages[0]);
    const stack = details.getByRole("list", { name: "Stack" });
    const links = details.getByRole("link");

    expect(await renderedLines(details)).toEqual([
      "June 2026",
      "Stack",
      "TypeScript",
      "Astro",
      "SVG",
      "Repository",
      "Live site",
    ]);
    await expect(details.getByRole("heading", { name: "Stack" })).toBeVisible();
    // innerText leaves out generated content, so check for the commas that
    // separate an inline Stack separately.
    const separators = await stack
      .getByRole("listitem")
      .evaluateAll((items) =>
        items.map((item) => getComputedStyle(item, "::before").content),
      );
    expect(separators).toEqual(["none", "none", "none"]);
    await expectAbove(stack, links.first());
    await expectRuleAbove(linksBlock, "thin");
    await expectNoBoxes(details);
  });
});

test.describe("A Post's details", () => {
  test("give its date, updated date and reading time one per line, then its Tags below a thin rule, all as plain text", async ({
    page,
  }) => {
    await page.setViewportSize(desktop);
    await page.goto("./blog/notes-on-note-g/");
    const { details, links } = parts(page, detailPages[2]);

    const lines = await renderedLines(details);
    expect(lines.slice(0, 2)).toEqual([
      "September 14, 2026",
      "Updated September 21, 2026",
    ]);
    expect(lines[2]).toMatch(/^\d+ min read$/);
    expect(lines.slice(3)).toEqual(["Algorithms", "Mathematics"]);
    await expectRuleAbove(links, "thin");
    await expectNoBoxes(details);
  });
});
