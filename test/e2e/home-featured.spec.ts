/**
 * Home with other numbers of featured Projects than the Filler content's 4,
 * checked in copies of the site built with only new Projects featured. Each
 * copy's pages are served in place of the real site's.
 */
import path from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { siteConfig } from "../../src/site.config";
import { buildWithFeatured, removeCopy } from "../build/build-copy";
import { basePath, resolveToFile } from "../build/output";
import {
  box,
  expectAbove,
  expectNoHorizontalScroll,
  expectSpans,
  expectWithin,
  pageGrid,
  rows,
} from "./layout";
import { viewports } from "./matrix";

const [phone, desktop] = viewports;

/** How many Projects each copy features, and how its tiles sit in rows. */
const counts = [
  { count: 1, inRows: [["both"]] },
  { count: 2, inRows: [["left", "right"]] },
  { count: 3, inRows: [["both"], ["left", "right"]] },
  {
    count: 7,
    inRows: [["both"], ["left", "right"], ["left", "right"], ["left", "right"]],
  },
];

const main = (page: Page) => page.getByRole("main");
const hero = (page: Page) =>
  main(page).getByRole("region", { name: siteConfig.name });
const featured = (page: Page) =>
  main(page).getByRole("region", { name: "Featured Projects" });
const featuredList = (page: Page) => featured(page).getByRole("list").first();
const tiles = (page: Page) => featured(page).getByRole("article");

/** Serves the page's requests for the site from the copy at `root`. */
async function serveCopy(page: Page, root: string) {
  const dist = path.join(root, "dist");
  await page.route(
    (url) => url.pathname.startsWith(basePath),
    (route) => {
      const file = resolveToFile(new URL(route.request().url()).pathname, dist);
      return file
        ? route.fulfill({ path: path.join(dist, file) })
        : route.fulfill({ status: 404 });
    },
  );
}

for (const { count, inRows } of counts) {
  test.describe(`Home with ${count} featured`, () => {
    // One build per copy, shared by its tests.
    test.describe.configure({ mode: "serial" });

    let root = "";

    test.beforeAll(() => {
      test.setTimeout(180_000);
      const build = buildWithFeatured({ published: count, drafts: 0 });
      root = build.root;
      expect(build.status, build.output).toBe(0);
    });

    test.afterAll(() => {
      if (root) removeCopy(root);
    });

    test("shows every featured Project, newest first", async ({ page }) => {
      await serveCopy(page, root);
      await page.goto("./");
      await expect(tiles(page).getByRole("heading")).toHaveText(
        Array.from(
          { length: count },
          (_, i) => `Featured Project ${count - i}`,
        ),
      );
    });

    test("sets the tiles in even rows beside the hero, with All Projects where they start, at desktop width", async ({
      page,
    }) => {
      await serveCopy(page, root);
      await page.setViewportSize(desktop);
      await page.goto("./");
      const grid = await pageGrid(page);
      await expectWithin(hero(page), grid, 1, 4);
      await expectSpans(featuredList(page), grid, 5, 12);
      expect(await rows(featuredList(page))).toEqual(inRows);
      const allProjects = featured(page).getByRole("link", {
        name: "All Projects",
      });
      expect(Math.round((await box(allProjects)).left)).toBe(
        Math.round(grid.start(5)),
      );
      await expectNoHorizontalScroll(page);
    });

    test("stacks the tiles in one column under the hero, at phone width", async ({
      page,
    }) => {
      await serveCopy(page, root);
      await page.setViewportSize(phone);
      await page.goto("./");
      const grid = await pageGrid(page);
      await expectSpans(featuredList(page), grid, 1, 12);
      await expectAbove(hero(page), featuredList(page));
      expect(await rows(featuredList(page))).toEqual(
        Array.from({ length: count }, () => ["both"]),
      );
      await expectNoHorizontalScroll(page);
    });
  });
}
