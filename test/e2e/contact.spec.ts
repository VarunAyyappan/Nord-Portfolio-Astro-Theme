import { expect, type Page, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import { expectNoBoxes, expectRuleAbove } from "./layout";
import { colorModes, viewports } from "./matrix";

const socialLinks = (page: Page) =>
  page
    .getByRole("main")
    .getByRole("region", { name: "Elsewhere" })
    .getByRole("listitem");

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

      test(`has no boxed cards or chips at ${viewport.name} width`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto("./contact/");
        await expectNoBoxes(page.getByRole("main"));
      });
    }

    test("divides the social links with thin rules", async ({ page }) => {
      await page.goto("./contact/");
      const items = await socialLinks(page).all();
      expect(items.length).toBeGreaterThan(1);
      for (const item of items.slice(1)) {
        await expectRuleAbove(item, "thin", colorScheme);
      }
    });
  });
}
