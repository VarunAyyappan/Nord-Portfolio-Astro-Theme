import { test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import { expectRuleAbove } from "./layout";
import { colorModes, viewports } from "./matrix";

for (const colorScheme of colorModes) {
  test.describe(`Experience in ${colorScheme} mode`, () => {
    test.use({ colorScheme });

    for (const viewport of viewports) {
      test(`page has no axe violations at ${viewport.name} width`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto("./experience/");
        await expectNoAxeViolations(page);
      });
    }

    test("divides the roles from Education with a thick rule", async ({
      page,
    }) => {
      await page.goto("./experience/");
      await expectRuleAbove(
        page.getByRole("main").getByRole("region", { name: "Education" }),
        "thick",
        colorScheme,
      );
    });
  });
}
