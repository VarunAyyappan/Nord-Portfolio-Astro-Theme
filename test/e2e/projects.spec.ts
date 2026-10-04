import { expect, type Locator, type Page, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import { colorModes, viewports } from "./matrix";

/** The newest Project's card on the index, which has a cover and both links. */
const newestCard = (page: Page) =>
  page.getByRole("main").getByRole("article").first();

/** Runs `open` on a card, then expects that Project's detail page. */
async function expectToOpenProject(
  page: Page,
  card: Locator,
  open: () => Promise<void>,
) {
  const title = (await card.getByRole("heading").textContent()) ?? "";
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
        const card = newestCard(page);
        await expectToOpenProject(page, card, () =>
          card.getByRole("link").click(),
        );
        await expectNoAxeViolations(page);
      });
    }
  });
}

test.describe("Project card", () => {
  test("opens the Project from anywhere on the card", async ({ page }) => {
    await page.goto("./projects/");
    const card = newestCard(page);
    // A corner of the card, away from the title link itself.
    const box = await card.boundingBox();
    await expectToOpenProject(page, card, () =>
      card.click({ position: { x: 8, y: (box?.height ?? 0) - 8 } }),
    );
  });
});
