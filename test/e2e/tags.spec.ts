import { expect, type Page, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import { colorModes, viewports } from "./matrix";

/** Opens the newest Post's first Tag from the Blog index. */
async function openFirstTag(page: Page) {
  await page.goto("./blog/");
  const tag = page
    .getByRole("main")
    .getByRole("article")
    .first()
    .getByRole("list", { name: "Tags" })
    .getByRole("link")
    .first();
  const name = (await tag.textContent())?.trim() ?? "";
  await tag.click();
  await expect(
    page.getByRole("heading", { level: 1, name: `Posts tagged ${name}` }),
  ).toBeVisible();
}

for (const colorScheme of colorModes) {
  test.describe(`Tags in ${colorScheme} mode`, () => {
    test.use({ colorScheme });

    for (const viewport of viewports) {
      test(`Tag page has no axe violations at ${viewport.name} width`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await openFirstTag(page);
        await expectNoAxeViolations(page);
      });
    }
  });
}
