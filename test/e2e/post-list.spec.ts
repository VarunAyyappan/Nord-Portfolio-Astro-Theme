import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  box,
  expectAbove,
  expectNoHorizontalScroll,
  expectRuleAbove,
  expectSameBaseline,
  expectSpans,
  expectWithin,
  pageGrid,
} from "./layout";
import { colorModes, viewports } from "./matrix";

const [phone, desktop] = viewports;

/** Every Post a page's main content lists. */
const listedPosts = (page: Page) => page.getByRole("main").getByRole("article");

/**
 * The pages that show the Post list in the page grid's right 8 columns, and
 * the Posts in it.
 */
const listPages: {
  name: string;
  path: string;
  posts: (page: Page) => Locator;
}[] = [
  { name: "the Blog index", path: "./blog/", posts: listedPosts },
  { name: "a Tag page", path: "./blog/tags/engines/", posts: listedPosts },
  {
    name: "Home",
    path: "./",
    posts: (page) =>
      page
        .getByRole("main")
        .getByRole("region", { name: "Latest Posts" })
        .getByRole("article"),
  },
];

const date = (post: Locator) => post.locator("time").first();
const title = (post: Locator) => post.getByRole("heading");

for (const { name, path, posts } of listPages) {
  test.describe(`Post list on ${name}`, () => {
    test("gives each date the first 2 of the list's 8 columns, with the title beside it, at desktop width", async ({
      page,
    }) => {
      await page.setViewportSize(desktop);
      await page.goto(path);
      const grid = await pageGrid(page);
      await expect(posts(page).first()).toBeVisible();
      for (const post of await posts(page).all()) {
        await expectWithin(date(post), grid, 5, 6);
        await expectSpans(title(post), grid, 7, 12);
        await expectSameBaseline(date(post), title(post));
      }
    });

    test("sets each date above its title, at phone width", async ({ page }) => {
      await page.setViewportSize(phone);
      await page.goto(path);
      const grid = await pageGrid(page);
      for (const post of await posts(page).all()) {
        await expectWithin(date(post), grid, 1, 12);
        await expectSpans(title(post), grid, 1, 12);
        await expectAbove(date(post), title(post));
      }
      await expectNoHorizontalScroll(page);
    });
  });
}

for (const colorMode of colorModes) {
  test.describe(`Post list in ${colorMode} mode`, () => {
    test.use({ colorScheme: colorMode });

    test("divides its Posts with a thin rule", async ({ page }) => {
      await page.goto("./blog/");
      const items = page
        .getByRole("main")
        .getByRole("list")
        .first()
        .locator("> li");
      for (const item of (await items.all()).slice(1)) {
        await expectRuleAbove(item, "thin", colorMode);
      }
    });
  });
}

test.describe("Blog pagination", () => {
  for (const viewport of viewports) {
    for (const { path, link } of [
      { path: "./blog/", link: "Older Posts" },
      { path: "./blog/2/", link: "Newer Posts" },
    ]) {
      test(`starts ${link} where the Post list starts, at ${viewport.name} width`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto(path);
        const main = page.getByRole("main");
        const list = await box(main.getByRole("list").first());
        const closing = await box(main.getByRole("link", { name: link }));
        expect(Math.round(closing.left)).toBe(Math.round(list.left));
      });
    }
  }
});
