import { expect, type Page, test } from "@playwright/test";

/** The `<loc>` URLs in a sitemap or sitemap index, as URL paths. */
async function sitemapPaths(page: Page, url: string): Promise<string[]> {
  const xml = await (await page.request.get(url)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, loc]) => new URL(loc).pathname,
  );
}

/** Every page the sitemap lists, plus the 404 page, as URL paths. */
async function everyPage(page: Page): Promise<string[]> {
  const sitemaps = await sitemapPaths(page, "./sitemap-index.xml");
  const pages = (
    await Promise.all(sitemaps.map((sitemap) => sitemapPaths(page, sitemap)))
  ).flat();
  expect(pages.length).toBeGreaterThan(0);
  return [...pages, "./no-such-page/"];
}

/** The text of every element on the page that renders its text in capitals. */
const allCapsText = (page: Page) =>
  page.evaluate(() =>
    [...document.body.querySelectorAll("*")]
      .filter((element) => {
        const style = getComputedStyle(element);
        return (
          style.textTransform === "uppercase" ||
          /^all-(small|petite)-caps$/.test(style.fontVariantCaps)
        );
      })
      .map((element) => element.textContent?.trim() ?? "")
      .filter(Boolean),
  );

/**
 * How each Stack on the page renders: per item, its text, whether it sits in
 * a box (a border, a background or a font of its own, as a pill does) and
 * whether it follows the item before it on the same line, and if so what
 * separates them.
 */
const stacks = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('[aria-label="Stack"]')].map((list) => {
      const listFont = getComputedStyle(list).fontFamily;
      const items = [...list.querySelectorAll("li")];
      return items.map((item, i) => {
        const style = getComputedStyle(item);
        const boxed =
          ["Top", "Right", "Bottom", "Left"].some(
            (side) =>
              style.getPropertyValue(`border-${side.toLowerCase()}-style`) !==
                "none" &&
              Number.parseFloat(
                style.getPropertyValue(`border-${side.toLowerCase()}-width`),
              ) > 0,
          ) ||
          style.backgroundColor !== "rgba(0, 0, 0, 0)" ||
          style.fontFamily !== listFont;
        const previous = items[i - 1];
        const inline =
          previous !== undefined &&
          Math.abs(
            item.getClientRects()[0].top -
              [...previous.getClientRects()].at(-1)!.top,
          ) < 1;
        const separator = inline
          ? getComputedStyle(item, "::before").content
          : undefined;
        return { item: item.textContent?.trim(), boxed, separator };
      });
    }),
  );

test.describe("Stack", () => {
  test("is plain text, comma-separated where it runs inline, on every page that shows it", async ({
    page,
  }) => {
    let shown = 0;
    const found: Record<string, unknown[]> = {};
    for (const path of await everyPage(page)) {
      await page.goto(path);
      for (const stack of await stacks(page)) {
        shown += 1;
        const wrong = stack.filter(
          ({ boxed, separator }) =>
            boxed || (separator !== undefined && separator !== '", "'),
        );
        if (wrong.length > 0) (found[path] ??= []).push(stack);
      }
    }
    expect(shown).toBeGreaterThan(0);
    expect(found).toEqual({});
  });
});

test.describe("labels", () => {
  test("never render in all caps, on any page", async ({ page }) => {
    const found: Record<string, string[]> = {};
    for (const path of await everyPage(page)) {
      await page.goto(path);
      const text = await allCapsText(page);
      if (text.length > 0) found[path] = text;
    }
    expect(found).toEqual({});
  });
});
