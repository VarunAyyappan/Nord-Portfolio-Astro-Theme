import { expect, type Page, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import { backgrounds, colorModes, viewports } from "./matrix";

/**
 * Opens the newest Post from the Blog index. In the filler content it has
 * code blocks and a table, which this checks so the scans can rely on it.
 */
async function openNewestPost(page: Page) {
  await page.goto("./blog/");
  const link = page
    .getByRole("main")
    .getByRole("article")
    .first()
    .getByRole("link");
  const title = (await link.textContent()) ?? "";
  await link.click();
  await expect(
    page.getByRole("heading", { level: 1, name: title }),
  ).toBeVisible();
  await expect(page.locator("main pre").first()).toBeVisible();
  await expect(page.getByRole("main").getByRole("table")).toBeVisible();
}

for (const colorScheme of colorModes) {
  test.describe(`Blog in ${colorScheme} mode`, () => {
    test.use({ colorScheme });

    for (const viewport of viewports) {
      test(`index has no axe violations at ${viewport.name} width`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto("./blog/");
        await expectNoAxeViolations(page);
      });

      test(`Post with code blocks and a table has no axe violations at ${viewport.name} width`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await openNewestPost(page);
        await expectNoAxeViolations(page);
      });
    }

    test("keeps code blocks dark", async ({ page }) => {
      await openNewestPost(page);
      for (const block of await page.locator("main pre").all()) {
        await expect(block).toHaveCSS("background-color", backgrounds.dark);
      }
    });
  });
}

test.describe("Blog pagination", () => {
  test("moves to older Posts and back", async ({ page }) => {
    await page.goto("./blog/");
    const newest = await page
      .getByRole("main")
      .getByRole("article")
      .first()
      .textContent();

    await page.getByRole("link", { name: "Older Posts" }).click();
    await expect(page).toHaveURL(/\/blog\/2\/$/);
    await expect(
      page.getByRole("main").getByRole("article").first(),
    ).not.toHaveText(newest ?? "");

    await page.getByRole("link", { name: "Newer Posts" }).click();
    await expect(page).toHaveURL(/\/blog\/$/);
    await expect(
      page.getByRole("main").getByRole("article").first(),
    ).toHaveText(newest ?? "");
  });
});
