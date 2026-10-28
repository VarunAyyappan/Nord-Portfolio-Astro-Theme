import { type Locator, type Page, test } from "@playwright/test";
import {
  expectAbove,
  expectNoHorizontalScroll,
  expectNoOverflow,
  expectSpans,
  expectStaysInViewOnScroll,
  expectWithin,
  pageGrid,
} from "./layout";
import { viewports } from "./matrix";

const [phone, desktop] = viewports;

/**
 * The pages whose heading hangs in the page grid's left 4 columns, beside
 * content in the right 8: each page's path, and the first thing in its
 * content column.
 */
const headingPages: {
  name: string;
  path: string;
  content: (main: Locator) => Locator;
}[] = [
  {
    name: "Experience",
    path: "./experience/",
    content: (main) => main.getByRole("region", { name: "Roles" }),
  },
  {
    name: "About",
    path: "./about/",
    content: (main) => main.getByRole("paragraph").first(),
  },
  {
    name: "Contact",
    path: "./contact/",
    content: (main) => main.getByRole("paragraph").first(),
  },
  {
    name: "Blog index",
    path: "./blog/",
    content: (main) => main.getByRole("list").first(),
  },
  {
    name: "Tag page",
    path: "./blog/tags/engines/",
    content: (main) => main.getByRole("list").first(),
  },
  {
    name: "Projects index",
    path: "./projects/",
    // The list of Project tiles, the first list on the page.
    content: (main) => main.getByRole("list").first(),
  },
];

const main = (page: Page) => page.getByRole("main");
const pageHeading = (page: Page) =>
  main(page).getByRole("heading", { level: 1 });

for (const { name, path, content } of headingPages) {
  test.describe(`${name} on the page grid`, () => {
    test("sets the heading in the left 4 columns, beside the content in the right 8, at desktop width", async ({
      page,
    }) => {
      await page.setViewportSize(desktop);
      await page.goto(path);
      const grid = await pageGrid(page);
      await expectWithin(pageHeading(page), grid, 1, 4);
      await expectNoOverflow(pageHeading(page));
      await expectSpans(content(main(page)), grid, 5, 12);
    });

    test("keeps the heading in view as the page scrolls, at desktop width", async ({
      page,
    }) => {
      // Short enough that even the shortest page scrolls.
      await page.setViewportSize({ width: desktop.width, height: 400 });
      await page.goto(path);
      await expectStaysInViewOnScroll(page, pageHeading(page));
    });

    test("stacks the heading above the content in one column, at phone width", async ({
      page,
    }) => {
      await page.setViewportSize(phone);
      await page.goto(path);
      const grid = await pageGrid(page);
      await expectWithin(pageHeading(page), grid, 1, 12);
      await expectNoOverflow(pageHeading(page));
      await expectSpans(content(main(page)), grid, 1, 12);
      await expectAbove(pageHeading(page), content(main(page)));
      await expectNoHorizontalScroll(page);
    });
  });
}

test.describe("404 page on the page grid", () => {
  for (const viewport of viewports) {
    test(`sets the heading across all 12 columns at ${viewport.name} width`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("./no-such-page/");
      const grid = await pageGrid(page);
      await expectSpans(pageHeading(page), grid, 1, 12);
      await expectNoOverflow(pageHeading(page));
      await expectNoHorizontalScroll(page);
    });
  }
});
