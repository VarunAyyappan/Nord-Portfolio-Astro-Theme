import { test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import { expectAbove, expectWithin, pageGrid } from "./layout";
import { colorModes, viewports } from "./matrix";

for (const colorScheme of colorModes) {
  test.describe(`About in ${colorScheme} mode`, () => {
    test.use({ colorScheme });

    for (const viewport of viewports) {
      test(`page has no axe violations at ${viewport.name} width`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto("./about/");
        await expectNoAxeViolations(page);
      });
    }
  });
}

/** The columns the heading takes at each width: all 12 on a phone, 4 on a desktop. */
const headingColumns = { phone: 12, desktop: 4 } as const;

test.describe("About portrait", () => {
  for (const viewport of viewports) {
    test(`sits above the heading, in the heading's column, at ${viewport.name} width`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("./about/");
      const main = page.getByRole("main");
      const portrait = main.getByRole("img");
      const heading = main.getByRole("heading", { level: 1 });
      const grid = await pageGrid(page);
      const columns = headingColumns[viewport.name];
      await expectWithin(portrait, grid, 1, columns);
      await expectWithin(heading, grid, 1, columns);
      await expectAbove(portrait, heading);
    });
  }
});
