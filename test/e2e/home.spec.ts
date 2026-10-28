import { expect, type Locator, type Page, test } from "@playwright/test";
import { siteConfig } from "../../src/site.config";
import { expectNoAxeViolations } from "./axe";
import {
  box,
  expectAbove,
  expectNoHorizontalScroll,
  expectNoOverflow,
  expectRuleAbove,
  expectSpans,
  expectWithin,
  pageGrid,
} from "./layout";
import { backgrounds, colorModes, viewports } from "./matrix";

const [phone, desktop] = viewports;

const main = (page: Page) => page.getByRole("main");

/** The hero, the region named for the Adopter. */
const hero = (page: Page) =>
  main(page).getByRole("region", { name: siteConfig.name });

const pageHeading = (page: Page) =>
  main(page).getByRole("heading", { level: 1 });

/** The list of featured Project tiles. */
const featuredList = (page: Page) =>
  main(page)
    .getByRole("region", { name: "Featured Projects" })
    .getByRole("list")
    .first();

/** One of Home's parts below the hero, the region named by its heading. */
const part = (page: Page, name: string) =>
  main(page).getByRole("region", { name });

/** Home's parts below the hero, in order, and the content of each. */
const parts = [
  {
    name: "Latest Posts",
    content: (page: Page) =>
      part(page, "Latest Posts").getByRole("list").first(),
  },
  {
    name: "Skills",
    // The Skill groups, whose first heading starts the content.
    content: (page: Page) =>
      part(page, "Skills").getByRole("heading", { level: 3 }).first(),
  },
];

for (const colorScheme of colorModes) {
  test.describe(`Home in ${colorScheme} mode`, () => {
    test.use({ colorScheme });

    test("follows the OS color scheme", async ({ page }) => {
      await page.goto("./");
      await expect(page.locator("body")).toHaveCSS(
        "background-color",
        backgrounds[colorScheme],
      );
    });

    for (const viewport of viewports) {
      test(`has no axe violations at ${viewport.name} width`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto("./");
        await expectNoAxeViolations(page);
      });
    }
  });
}

test.describe("Home at desktop width", () => {
  test.use({ viewport: desktop });

  test("sets the hero in the left 4 columns, beside the featured Projects in the right 8", async ({
    page,
  }) => {
    await page.goto("./");
    const grid = await pageGrid(page);
    await expectWithin(hero(page), grid, 1, 4);
    await expectNoOverflow(pageHeading(page));
    await expectSpans(featuredList(page), grid, 5, 12);
    expect(Math.round((await box(hero(page))).top)).toBe(
      Math.round((await box(featuredList(page))).top),
    );
    await expectNoHorizontalScroll(page);
  });

  for (const { name, content } of parts) {
    test(`hangs the ${name} heading in the left 4 columns, level with its content in the right 8`, async ({
      page,
    }) => {
      await page.goto("./");
      const grid = await pageGrid(page);
      const heading = part(page, name).getByRole("heading", { level: 2 });
      await expectWithin(heading, grid, 1, 4);
      await expectWithin(content(page), grid, 5, 12);
      expect(Math.round((await box(heading)).top)).toBe(
        Math.round((await box(content(page))).top),
      );
    });
  }

  test("keeps the hero in view while the featured Projects scroll past, then lets it go with them", async ({
    page,
  }) => {
    // Short enough that the featured Projects scroll well past the hero.
    await page.setViewportSize({ width: desktop.width, height: 400 });
    await page.goto("./");
    const { top } = await box(hero(page));
    const { bottom } = await box(featuredList(page));
    await page.evaluate((y) => window.scrollTo({ top: y }), bottom - 400);
    expect(
      await page.evaluate(() => window.scrollY),
      "the page scrolls past where the hero starts",
    ).toBeGreaterThan(top);
    await expect(pageHeading(page)).toBeInViewport({ ratio: 1 });
    // Scrolled to the end, the hero has left with its row, above the parts
    // below it rather than over them.
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight }),
    );
    await expectAbove(hero(page), part(page, parts[0].name));
  });
});

test("names the featured Projects for assistive technology, without showing the heading", async ({
  page,
}) => {
  await page.goto("./");
  const heading = main(page)
    .getByRole("region", { name: "Featured Projects" })
    .getByRole("heading", { level: 2, name: "Featured Projects" });
  await expect(heading).toHaveCount(1);
  const { left, right, top, bottom } = await box(heading);
  expect(right - left).toBeLessThanOrEqual(1);
  expect(bottom - top).toBeLessThanOrEqual(1);
});

for (const viewport of viewports) {
  test(`starts All Projects and All Posts where their lists start, at ${viewport.name} width`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("./");
    const left = async (locator: Locator) =>
      Math.round((await box(locator)).left);
    const allProjects = main(page).getByRole("link", { name: "All Projects" });
    const allPosts = main(page).getByRole("link", { name: "All Posts" });
    expect(await left(allProjects)).toBe(await left(featuredList(page)));
    expect(await left(allPosts)).toBe(await left(parts[0].content(page)));
    expect(await left(allProjects)).toBe(await left(allPosts));
  });
}

test.describe("Home at phone width", () => {
  test.use({ viewport: phone });

  test("stacks everything in one column, in reading order", async ({
    page,
  }) => {
    await page.goto("./");
    const grid = await pageGrid(page);
    const inOrder = [
      hero(page),
      featuredList(page),
      ...parts.flatMap(({ name, content }) => [
        part(page, name).getByRole("heading", { level: 2 }),
        content(page),
      ]),
    ];
    await expectSpans(hero(page), grid, 1, 12);
    await expectSpans(featuredList(page), grid, 1, 12);
    for (const [i, lower] of inOrder.entries()) {
      await expectWithin(lower, grid, 1, 12);
      if (i > 0) await expectAbove(inOrder[i - 1], lower);
    }
    await expectNoOverflow(pageHeading(page));
    await expectNoHorizontalScroll(page);
  });
});

for (const colorMode of colorModes) {
  test.describe(`Home's parts in ${colorMode} mode`, () => {
    test.use({ colorScheme: colorMode });

    for (const viewport of viewports) {
      test(`each start under a thick rule across the grid, below the hero, at ${viewport.name} width`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto("./");
        const grid = await pageGrid(page);
        for (const { name } of parts) {
          await expectRuleAbove(part(page, name), "thick", colorMode);
          await expectSpans(part(page, name), grid, 1, 12);
        }
      });
    }
  });
}
