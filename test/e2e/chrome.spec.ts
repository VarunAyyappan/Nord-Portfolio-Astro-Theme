import { expect, type Page, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import { colorModes, viewports } from "./matrix";

const [phone, desktop] = viewports;

const menuButton = (page: Page) =>
  page.getByRole("banner").getByRole("button", { name: "Menu" });
const homeNavLink = (page: Page) =>
  page.getByRole("navigation", { name: "Main" }).getByRole("link", {
    name: "Home",
  });

test.describe("skip link", () => {
  test("is the first Tab stop and jumps past the header to the main content", async ({
    page,
  }) => {
    await page.goto("./no-such-page/");
    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: "Skip to content" });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();

    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("main").getByRole("link", { name: "Back to Home" }),
    ).toBeFocused();
  });
});

test.describe("404 page", () => {
  test("answers unknown URLs with a way back Home", async ({ page }) => {
    const response = await page.goto("./no-such-page/");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Back to Home" }).click();
    await expect(page).toHaveURL("./");
  });
});

test.describe("mobile menu", () => {
  test("opens and closes at phone width, keeping aria-expanded in sync", async ({
    page,
  }) => {
    await page.setViewportSize(phone);
    await page.goto("./");
    const button = menuButton(page);

    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(homeNavLink(page)).toBeHidden();

    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(homeNavLink(page)).toBeVisible();

    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(homeNavLink(page)).toBeHidden();
  });

  test("is not needed at desktop width", async ({ page }) => {
    await page.setViewportSize(desktop);
    await page.goto("./");
    await expect(menuButton(page)).toBeHidden();
    await expect(homeNavLink(page)).toBeVisible();
  });
});

test.describe("mobile menu without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("keeps the nav links reachable at phone width", async ({ page }) => {
    await page.setViewportSize(phone);
    await page.goto("./");
    await expect(menuButton(page)).toBeHidden();
    await expect(homeNavLink(page)).toBeVisible();
  });
});

for (const colorScheme of colorModes) {
  test.describe(`site chrome in ${colorScheme} mode`, () => {
    test.use({ colorScheme });

    for (const viewport of viewports) {
      test(`404 page has no axe violations at ${viewport.name} width`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto("./no-such-page/");
        await expectNoAxeViolations(page);
      });
    }

    test("open mobile menu has no axe violations", async ({ page }) => {
      await page.setViewportSize(phone);
      await page.goto("./");
      await menuButton(page).click();
      await expect(homeNavLink(page)).toBeVisible();
      await expectNoAxeViolations(page);
    });
  });
}
