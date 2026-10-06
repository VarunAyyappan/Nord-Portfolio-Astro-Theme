import { test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import { colorModes, viewports } from "./matrix";

for (const colorScheme of colorModes) {
  test.describe(`Contact in ${colorScheme} mode`, () => {
    test.use({ colorScheme });

    for (const viewport of viewports) {
      test(`page has no axe violations at ${viewport.name} width`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto("./contact/");
        await expectNoAxeViolations(page);
      });
    }
  });
}
