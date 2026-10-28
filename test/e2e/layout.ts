/**
 * Layout checks: where elements sit on the page, measured from their boxes
 * rather than compared as pixels, so they hold on any machine's fonts.
 */
import { expect, type Locator, type Page } from "@playwright/test";

/** An element's box in the viewport, in CSS pixels. */
export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** The element's box, failing the test if it isn't laid out. */
export async function box(locator: Locator): Promise<Box> {
  const found = await locator.boundingBox();
  if (!found) throw new Error(`${locator} isn't laid out`);
  return {
    left: found.x,
    right: found.x + found.width,
    top: found.y,
    bottom: found.y + found.height,
  };
}

/** The gap between the page grid's columns, 1.5rem, in CSS pixels. */
const gridGap = 24;

/**
 * The page grid's 12 columns. Its edges are the header's content edges,
 * since the header spans the same width as the grid.
 */
export interface PageGrid {
  left: number;
  right: number;
  /** Where column `n` (1 to 12) starts. */
  start(n: number): number;
  /** Where column `n` (1 to 12) ends. */
  end(n: number): number;
}

/** The page grid as the page is currently laid out. */
export async function pageGrid(page: Page): Promise<PageGrid> {
  const { left, right } = await page.getByRole("banner").evaluate((header) => {
    const rect = header.getBoundingClientRect();
    const style = getComputedStyle(header);
    return {
      left: rect.left + Number.parseFloat(style.paddingLeft),
      right: rect.right - Number.parseFloat(style.paddingRight),
    };
  });
  const column = (right - left - 11 * gridGap) / 12;
  return {
    left,
    right,
    start: (n) => left + (n - 1) * (column + gridGap),
    end: (n) => left + n * column + (n - 1) * gridGap,
  };
}

/** Rounds a position to the nearest pixel, so subpixel layout still matches. */
const px = (position: number) => Math.round(position);

/** Expects the element to start at column `from` and end at column `to`. */
export async function expectSpans(
  locator: Locator,
  grid: PageGrid,
  from: number,
  to: number,
) {
  const { left, right } = await box(locator);
  expect({ left: px(left), right: px(right) }).toEqual({
    left: px(grid.start(from)),
    right: px(grid.end(to)),
  });
}

/** Expects the element to sit inside columns `from` to `to`, starting at `from`. */
export async function expectWithin(
  locator: Locator,
  grid: PageGrid,
  from: number,
  to: number,
) {
  const { left, right } = await box(locator);
  expect(px(left)).toBe(px(grid.start(from)));
  expect(px(right)).toBeLessThanOrEqual(px(grid.end(to)));
}

/** Expects `upper` to end above where `lower` starts. */
export async function expectAbove(upper: Locator, lower: Locator) {
  expect(px((await box(upper)).bottom)).toBeLessThanOrEqual(
    px((await box(lower)).top),
  );
}

/** Expects the element's text to fit its box, with nothing running out of it. */
export async function expectNoOverflow(locator: Locator) {
  const { scrollWidth, clientWidth } = await locator.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

/** Expects the page to fit the viewport's width, with no sideways scrolling. */
export async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

/**
 * Scrolls to the bottom of the page, far enough that the element would have
 * left the viewport, and expects it still in view.
 */
export async function expectStaysInViewOnScroll(page: Page, locator: Locator) {
  const { bottom } = await box(locator);
  await page.evaluate(() =>
    window.scrollTo({ top: document.documentElement.scrollHeight }),
  );
  const scrolled = await page.evaluate(() => window.scrollY);
  expect(scrolled, "the page scrolls past the element").toBeGreaterThan(bottom);
  await expect(locator).toBeInViewport({ ratio: 1 });
}
