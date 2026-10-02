import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { colorModes, viewports } from "./matrix";

/** Polar Night nord0 and Snow Storm nord6, as computed CSS colors. */
const backgrounds = {
  dark: "rgb(46, 52, 64)",
  light: "rgb(236, 239, 244)",
} as const;

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
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(results.violations).toEqual([]);
      });
    }
  });
}
