import { expect, type Locator, type Page, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import { box, expectAbove, rows } from "./layout";
import { colorModes, viewports } from "./matrix";

const [phone, desktop] = viewports;

/** The list of Project tiles on the Projects index. */
const indexList = (page: Page) =>
  page.getByRole("main").getByRole("list").first();

/** The Project tiles on the Projects index, newest first. */
const indexTiles = (page: Page) => indexList(page).getByRole("article");

/** The newest Project's tile on the index, which has a cover and both links. */
const newestTile = (page: Page) => indexTiles(page).first();

/** The list of featured Projects' tiles on Home. */
const homeList = (page: Page) =>
  page
    .getByRole("main")
    .getByRole("region", { name: "Featured Projects" })
    .getByRole("list")
    .first();

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
    expect(await rows(indexList(page))).toEqual([
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
    expect(await rows(homeList(page))).toEqual([
      ["left", "right"],
      ["left", "right"],
    ]);
  });

  for (const [place, path, list] of [
    ["the Projects index", "./projects/", indexList],
    ["Home", "./", homeList],
  ] as const) {
    test(`stack in one column at phone width, on ${place}`, async ({
      page,
    }) => {
      await page.setViewportSize(phone);
      await page.goto(path);
      const found = await rows(list(page));
      expect(found.length).toBeGreaterThan(1);
      expect(found).toEqual(found.map(() => ["both"]));
    });
  }

  test("are not cards: no border or background of their own", async ({
    page,
  }) => {
    await page.goto("./projects/");
    for (const tile of await indexTiles(page).all()) {
      const look = await tile.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          border: style.borderStyle,
          background: style.backgroundColor,
        };
      });
      expect(look).toEqual({ border: "none", background: "rgba(0, 0, 0, 0)" });
    }
  });

  test("lead with the cover, the title under it, for a Project with a cover", async ({
    page,
  }) => {
    await page.goto("./projects/");
    const tile = newestTile(page);
    // The cover is decoration, with empty alt, so it has no img role.
    const image = tile.locator("img");
    await expect(image).toHaveCount(1);
    expect(Math.round((await box(image)).top)).toBe(
      Math.round((await box(tile)).top),
    );
    await expectAbove(image, tile.getByRole("heading"));
  });

  test("set the title as a filled plate where the cover would be, for a Project without one", async ({
    page,
  }) => {
    await page.setViewportSize(desktop);
    await page.goto("./projects/");
    // The second row holds a Project with a cover beside one without.
    const covered = indexTiles(page).nth(1);
    const plain = indexTiles(page).nth(2);
    await expect(plain.locator("img")).toHaveCount(0);
    await expect(covered.locator("img")).toHaveCount(1);
    const plate = await box(plain.getByRole("heading"));
    const cover = await box(covered.locator("img"));
    const tileBox = await box(plain);
    const px = Math.round;
    expect({
      left: px(plate.left),
      right: px(plate.right),
      top: px(plate.top),
      bottom: px(plate.bottom),
    }).toEqual({
      left: px(tileBox.left),
      right: px(tileBox.right),
      top: px(cover.top),
      bottom: px(cover.bottom),
    });
    await expect(plain.getByRole("heading")).not.toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
  });

  test("show a focus ring around the whole tile when its link has focus", async ({
    page,
  }) => {
    await page.goto("./projects/");
    const tile = newestTile(page);
    await tile.getByRole("link").focus();
    await expect(tile).toHaveCSS("outline-style", "solid");
    await expect(tile).not.toHaveCSS("outline-width", "0px");
  });

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
