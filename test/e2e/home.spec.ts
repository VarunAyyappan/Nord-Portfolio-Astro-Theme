import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import { backgrounds, colorModes, viewports } from "./matrix";

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
