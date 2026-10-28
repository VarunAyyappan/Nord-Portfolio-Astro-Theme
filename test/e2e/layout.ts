/**
 * Layout checks: where elements sit on the page, measured from their boxes
 * rather than compared as pixels, so they hold on any machine's fonts.
 */
import { expect, type Locator, type Page } from "@playwright/test";
import type { colorModes } from "./matrix";

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

/**
 * The outermost element inside `within` that holds `item` but not `apart`:
 * one column or block of a layout, found by what it holds rather than by
 * its tag, class or place in the markup. `item` and `apart` are looked up
 * inside each candidate, so they can start from the page.
 */
export function blockHolding(within: Locator, item: Locator, apart: Locator) {
  return within.locator("*").filter({ has: item, hasNot: apart }).first();
}

/**
 * How the Project tiles in `tileList` are set in rows: one array per row, top
 * to bottom, saying of each tile whether it spans the whole list ("both"),
 * or sits in its left or right column.
 */
export async function rows(tileList: Locator) {
  const tiles = tileList.getByRole("article");
  const list = await box(tileList);
  const middle = (list.left + list.right) / 2;
  const near = (a: number, b: number) => Math.abs(a - b) < 1;
  const found = new Map<number, string[]>();
  for (const tile of await tiles.all()) {
    const { left, right, top } = await box(tile);
    const place =
      near(left, list.left) && near(right, list.right)
        ? "both"
        : near(left, list.left) && right < middle
          ? "left"
          : near(right, list.right) && left > middle
            ? "right"
            : `elsewhere (${left}–${right})`;
    const row = Math.round(top);
    found.set(row, [...(found.get(row) ?? []), place]);
  }
  return [...found.entries()].toSorted(([a], [b]) => a - b).map(([, r]) => r);
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

/**
 * Expects nothing inside the element to be drawn as a box (a card, chip or
 * pill): no background of its own, and no border all the way round. Code
 * keeps its own styling, and images and decoration hidden from assistive
 * technology, such as Availability's dot, are left out.
 */
export async function expectNoBoxes(locator: Locator) {
  const boxed = await locator.evaluate((root) =>
    [...root.querySelectorAll("*")]
      .filter((element) => {
        if (
          element.closest(
            'code, pre, kbd, samp, img, picture, svg, [aria-hidden="true"]',
          )
        ) {
          return false;
        }
        const style = getComputedStyle(element);
        const bordered = ["top", "right", "bottom", "left"].every(
          (side) =>
            style.getPropertyValue(`border-${side}-style`) !== "none" &&
            Number.parseFloat(style.getPropertyValue(`border-${side}-width`)) >
              0,
        );
        return bordered || style.backgroundColor !== "rgba(0, 0, 0, 0)";
      })
      .map((element) => element.outerHTML.slice(0, 80)),
  );
  expect(boxed).toEqual([]);
}

/**
 * The rules that divide a page, as computed `border-top` values in each
 * Color mode: a thick one in the text color between sections, and a thin
 * one in the border color between the items in a list.
 */
const rules = {
  thick: {
    light: "4px solid rgb(46, 52, 64)",
    dark: "4px solid rgb(236, 239, 244)",
  },
  thin: {
    light: "1px solid rgb(216, 222, 233)",
    dark: "1px solid rgb(76, 86, 106)",
  },
} as const;

/** Expects a rule of the given kind along the element's top edge. */
export async function expectRuleAbove(
  locator: Locator,
  kind: keyof typeof rules,
  colorMode: (typeof colorModes)[number] = "light",
) {
  await expect(locator).toHaveCSS("border-top", rules[kind][colorMode]);
}

/**
 * Where the first line of the element's text sits, as the y position of
 * its baseline: a zero-size probe set on the baseline just before the first
 * character, measured and removed again.
 */
export async function firstBaseline(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.textContent?.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP,
    });
    const text = walker.nextNode();
    if (!text?.parentNode) throw new Error("The element has no text");
    const probe = document.createElement("span");
    probe.style.cssText =
      "display: inline-block; width: 0; height: 0; vertical-align: baseline";
    text.parentNode.insertBefore(probe, text);
    const { bottom } = probe.getBoundingClientRect();
    probe.remove();
    return bottom;
  });
}

/** Expects the first lines of both elements' text to share a baseline. */
export async function expectSameBaseline(a: Locator, b: Locator) {
  expect(px(await firstBaseline(a))).toBe(px(await firstBaseline(b)));
}
