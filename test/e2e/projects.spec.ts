import { expect, type Locator, type Page, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import { box } from "./layout";
import { colorModes, viewports } from "./matrix";

const [phone, desktop] = viewports;

/** The Project tiles on the Projects index, newest first. */
const indexTiles = (page: Page) =>
  page.getByRole("main").getByRole("article");

/** The newest Project's tile on the index, which has a cover and both links. */
const newestTile = (page: Page) => indexTiles(page).first();

/** The featured Projects' tiles on Home, newest first. */
const homeTiles = (page: Page) =>
  page
    .getByRole("main")
    .getByRole("region", { name: "Featured Projects" })
    .getByRole("article");

/** Runs `open` on a tile, then expects that Project's detail page. */
async function expectToOpenProject(
  page: Page,
  tile: Locator,
  open: () => Promise<void>,
) {
  const title = (await tile.getByRole("heading").textContent()) ?? "";
  await open();
  await expect(
    page.getByRole("heading", { level: 1, name: title }),
  ).toBeVisible();
}

/**
 * How the tiles are set in rows: one array per row, top to bottom, saying
 * of each tile whether it spans the whole list ("both"), or sits in its
 * left or right column.
 */
async function rows(tiles: Locator) {
  const list = await box(tiles.first().locator("xpath=ancestor::ul[1]"));
  const middle = (list.left + list.right) / 2;
  const near = (a: number, b: number) => Math.abs(a - b) < 1;
  const found = new Map<number, string[]>();
  for (const tile of await tiles.all()) {
    const { left, right, top } = await box(tile);
    const place =
      near(left, list.left) && near(right, list.right)
        ? "both"
        : near(left, list.left) && right < middle
          ? "left"
          : near(right, list.right) && left > middle
            ? "right"
            : `elsewhere (${left}–${right})`;
    const row = Math.round(top);
    found.set(row, [...(found.get(row) ?? []), place]);
  }
  return [...found.entries()].toSorted(([a], [b]) => a - b).map(([, r]) => r);
}

for (const colorScheme of colorModes) {
  test.describe(`Projects in ${colorScheme} mode`, () => {
    test.use({ colorScheme });

    for (const viewport of viewports) {
      test(`index has no axe violations at ${viewport.name} width`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto("./projects/");
        await expectNoAxeViolations(page);
      });

      test(`detail page has no axe violations at ${viewport.name} width`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto("./projects/");
        const tile = newestTile(page);
        await expectToOpenProject(page, tile, () =>
          tile.getByRole("link").click(),
        );
        await expectNoAxeViolations(page);
      });
    }
  });
}

test.describe("Project tiles", () => {
  test("sit two to a row at desktop width, the first across both columns when there's an odd number", async ({
    page,
  }) => {
    await page.setViewportSize(desktop);
    await page.goto("./projects/");
    // The Filler content publishes 5 Projects.
    expect(await rows(indexTiles(page))).toEqual([
      ["both"],
      ["left", "right"],
      ["left", "right"],
    ]);
  });

  test("sit two to a row at desktop width, with none across both when there's an even number", async ({
    page,
  }) => {
    await page.setViewportSize(desktop);
    await page.goto("./");
    // The Filler content features 4 published Projects.
    expect(await rows(homeTiles(page))).toEqual([
      ["left", "right"],
      ["left", "right"],
    ]);
  });

  for (const [place, path, tiles] of [
    ["the Projects index", "./projects/", indexTiles],
    ["Home", "./", homeTiles],
  ] as const) {
    test(`stack in one column at phone width, on ${place}`, async ({
      page,
    }) => {
      await page.setViewportSize(phone);
      await page.goto(path);
      const found = await rows(tiles(page));
      expect(found.length).toBeGreaterThan(1);
      expect(found).toEqual(found.map(() => ["both"]));
    });
  }

  test("open the Project from anywhere on the tile", async ({ page }) => {
    await page.goto("./projects/");
    const tile = newestTile(page);
    // A corner of the tile, away from the title link itself.
    const tileBox = await box(tile);
    await expectToOpenProject(page, tile, () =>
      tile.click({
        position: { x: 8, y: tileBox.bottom - tileBox.top - 8 },
      }),
    );
  });
});
