import { expect, type Page, test } from "@playwright/test";
import {
  colorModeSettings,
  colorModeStorageKey,
} from "../../src/lib/color-mode";
import { expectNoAxeViolations } from "./axe";
import { backgrounds, colorModes, viewports } from "./matrix";

const toggle = (page: Page) =>
  page.getByRole("banner").getByRole("button", { name: /^Color mode/ });

const expectRenderedMode = (page: Page, mode: (typeof colorModes)[number]) =>
  expect(page.locator("body")).toHaveCSS("background-color", backgrounds[mode]);

test.describe("color mode toggle", () => {
  // A light OS, so the dark setting is visibly an override.
  test.use({ colorScheme: "light" });

  test("cycles system → dark → light → system, naming the setting", async ({
    page,
  }) => {
    await page.goto("./");
    await expect(toggle(page)).toHaveAccessibleName("Color mode: system");
    await expectRenderedMode(page, "light");

    await toggle(page).click();
    await expect(toggle(page)).toHaveAccessibleName("Color mode: dark");
    await expectRenderedMode(page, "dark");

    await toggle(page).click();
    await expect(toggle(page)).toHaveAccessibleName("Color mode: light");
    await expectRenderedMode(page, "light");

    await toggle(page).click();
    await expect(toggle(page)).toHaveAccessibleName("Color mode: system");
    await expectRenderedMode(page, "light");
  });

  test("remembers the setting across a reload and a navigation", async ({
    page,
  }) => {
    await page.goto("./");
    await toggle(page).click();
    await expect(toggle(page)).toHaveAccessibleName("Color mode: dark");

    await page.reload();
    await expect(toggle(page)).toHaveAccessibleName("Color mode: dark");
    await expectRenderedMode(page, "dark");

    await page.goto("./no-such-page/");
    await expect(toggle(page)).toHaveAccessibleName("Color mode: dark");
    await expectRenderedMode(page, "dark");
  });

  test("renders a saved setting from the first frame, without a flash", async ({
    page,
  }) => {
    await page.goto("./");
    await toggle(page).click();
    await expect(toggle(page)).toHaveAccessibleName("Color mode: dark");

    // Probes the body's background with a classic script injected as the
    // first thing in <body>. It runs once the render-blocking stylesheets
    // have loaded and before any content is parsed: what the first frame
    // can paint.
    await page.route("**/*", async (route) => {
      if (route.request().resourceType() !== "document") {
        return route.fallback();
      }
      const response = await route.fetch();
      const html = (await response.text()).replace(
        /<body[^>]*>/,
        "$&<script>window.firstFrameBackground = getComputedStyle(document.body).backgroundColor;</script>",
      );
      return route.fulfill({ response, body: html });
    });
    await page.reload();

    const firstFrameBackground = await page.evaluate(() =>
      Reflect.get(window, "firstFrameBackground"),
    );
    expect(firstFrameBackground).toBe(backgrounds.dark);
  });

  test("in the system setting, follows the OS as it changes", async ({
    page,
  }) => {
    await page.goto("./");
    // Round the cycle back to system, so it is a choice and not a default.
    for (let click = 0; click < 3; click++) await toggle(page).click();
    await expect(toggle(page)).toHaveAccessibleName("Color mode: system");
    await page.reload();

    await page.emulateMedia({ colorScheme: "dark" });
    await expectRenderedMode(page, "dark");
    await page.emulateMedia({ colorScheme: "light" });
    await expectRenderedMode(page, "light");
  });

  test("an override ignores the OS as it changes", async ({ page }) => {
    await page.goto("./");
    await toggle(page).click();
    await toggle(page).click();
    await expect(toggle(page)).toHaveAccessibleName("Color mode: light");

    await page.emulateMedia({ colorScheme: "dark" });
    await expectRenderedMode(page, "light");
  });

  test("falls back to system, and still toggles, when storage throws", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("Storage is disabled", "SecurityError");
        },
      });
    });
    await page.goto("./");
    await expect(toggle(page)).toHaveAccessibleName("Color mode: system");
    await expectRenderedMode(page, "light");

    await toggle(page).click();
    await expect(toggle(page)).toHaveAccessibleName("Color mode: dark");
    await expectRenderedMode(page, "dark");
  });

  test("treats a stored value that isn't a setting as system", async ({
    page,
  }) => {
    await page.goto("./");
    await page.evaluate(
      (key) => localStorage.setItem(key, "sepia"),
      colorModeStorageKey,
    );
    await page.reload();
    await expect(toggle(page)).toHaveAccessibleName("Color mode: system");
    await expectRenderedMode(page, "light");
  });
});

test.describe("color mode without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const colorScheme of colorModes) {
    test(`hides the toggle and follows a ${colorScheme} OS`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto("./");
      await expect(toggle(page)).toBeHidden();
      await expectRenderedMode(page, colorScheme);
    });
  }
});

for (const colorScheme of colorModes) {
  test.describe(`color mode toggle on a ${colorScheme} OS`, () => {
    test.use({ colorScheme });

    for (const [clicks, setting] of colorModeSettings.entries()) {
      for (const viewport of viewports) {
        test(`has no axe violations in the ${setting} setting at ${viewport.name} width`, async ({
          page,
        }) => {
          await page.setViewportSize(viewport);
          await page.goto("./");
          for (let click = 0; click < clicks; click++) {
            await toggle(page).click();
          }
          await expect(toggle(page)).toHaveAccessibleName(
            `Color mode: ${setting}`,
          );
          await expectNoAxeViolations(page);
        });
      }
    }
  });
}
