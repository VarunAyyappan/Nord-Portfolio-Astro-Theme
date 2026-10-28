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
