import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "node-html-parser";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildCopy, type CopyBuild, removeCopy } from "./build-copy";
import { publishedPosts } from "./content";
import { outDir, readOutput, resolveToFile, siteOrigin } from "./output";

/** Nord's Polar Night colors, the backgrounds of its dark surfaces. */
const polarNight = ["#2e3440", "#3b4252", "#434c5e", "#4c566a"];

/** How far in from each edge of a share image nothing but background shows. */
const clearEdge = 32;

/** The output file a page's `og:image` resolves to, under `dist`. */
function shareImageOf(dist: string, page: string) {
  const html = parse(readOutput(page, dist));
  const url = new URL(
    html.querySelector('meta[property="og:image"]')?.getAttribute("content") ??
      "",
  );
  expect(url.origin).toBe(siteOrigin);
  const file = resolveToFile(url.pathname, dist);
  expect(file).toBeDefined();
  return path.join(dist, file ?? "");
}

/**
 * A share image's background, as a hex color, and how many of its pixels
 * differ from it: all of them, and those within `clearEdge` of an edge.
 */
async function inkOf(file: string) {
  const { data, info } = await sharp(file)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const at = (x: number, y: number) => {
    const i = (y * info.width + x) * info.channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const [r, g, b] = at(0, 0);
  let inked = 0;
  let inkedAtEdge = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const [pr, pg, pb] = at(x, y);
      if (pr === r && pg === g && pb === b) continue;
      inked++;
      const nearEdge =
        x < clearEdge ||
        y < clearEdge ||
        x >= info.width - clearEdge ||
        y >= info.height - clearEdge;
      if (nearEdge) inkedAtEdge++;
    }
  }
  const hex = `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  return {
    size: [info.width, info.height],
    background: hex,
    inked,
    inkedAtEdge,
  };
}

/** Checks a generated share image: preview size, Nord, and text kept inside. */
async function expectWellFormed(file: string) {
  const ink = await inkOf(file);
  expect(ink.size).toEqual([1200, 630]);
  expect(polarNight).toContain(ink.background);
  expect(ink.inked).toBeGreaterThan(0);
  expect(ink.inkedAtEdge).toBe(0);
}

/** A share image's bottom strip, where the name and the logo sit. */
const footer = { top: 480, bottom: 630 };

/** The favicon's color: nord8, the "N" drawn on its square. */
const faviconInk = [0x88, 0xc0, 0xd0];

/**
 * The ink in a share image's footer, as the columns it covers, left to
 * right, each with its top and bottom row, and how many of its pixels are
 * the favicon's color.
 */
async function footerInkOf(file: string) {
  const { data, info } = await sharp(file)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const at = (x: number, y: number) => {
    const i = (y * info.width + x) * info.channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const background = at(0, 0);
  const columns: { x: number; top: number; bottom: number }[] = [];
  let faviconColored = 0;
  for (let x = 0; x < info.width; x++) {
    let [top, bottom] = [Number.POSITIVE_INFINITY, -1];
    for (let y = footer.top; y < footer.bottom; y++) {
      const pixel = at(x, y);
      if (pixel.every((c, i) => c === background[i])) continue;
      [top, bottom] = [Math.min(top, y), Math.max(bottom, y)];
      if (pixel.every((c, i) => Math.abs(c - faviconInk[i]) <= 4)) {
        faviconColored++;
      }
    }
    if (bottom >= 0) columns.push({ x, top, bottom });
  }
  return { columns, faviconColored };
}

/** Splits footer ink into runs of columns at least `gap` columns apart. */
function inkRuns(columns: { x: number; top: number; bottom: number }[]) {
  const gap = 24;
  const runs: { left: number; right: number; top: number; bottom: number }[] =
    [];
  for (const { x, top, bottom } of columns) {
    const last = runs.at(-1);
    if (last && x - last.right <= gap) {
      last.right = x;
      last.top = Math.min(last.top, top);
      last.bottom = Math.max(last.bottom, bottom);
    } else {
      runs.push({ left: x, right: x, top, bottom });
    }
  }
  return runs;
}

/** The space around a share image's content on every side, in pixels. */
const margin = 80;

/**
 * Checks a share image's footer: the name on the left margin and the favicon
 * on the right one, apart, with their middles in line.
 */
async function expectNameAndLogo(file: string) {
  const ink = await footerInkOf(file);
  const runs = inkRuns(ink.columns);
  expect(runs).toHaveLength(2);
  const [name, logo] = runs;
  // Within a few pixels, the space a letter keeps at its side.
  expect(name.left - margin).toBeGreaterThanOrEqual(0);
  expect(name.left - margin).toBeLessThanOrEqual(4);
  expect(1200 - margin - 1 - logo.right).toBeGreaterThanOrEqual(0);
  expect(1200 - margin - 1 - logo.right).toBeLessThanOrEqual(1);
  expect(ink.faviconColored).toBeGreaterThan(100);
  const middle = (run: { top: number; bottom: number }) =>
    (run.top + run.bottom) / 2;
  expect(Math.abs(middle(name) - middle(logo))).toBeLessThanOrEqual(12);
  return { name, logo };
}

describe.each(publishedPosts().filter((post) => !post.cover))(
  "$title's generated share image",
  (post) => {
    const file = () => shareImageOf(outDir, `blog/${post.id}/index.html`);

    it("shows text on a Nord background, clear of the edges", async () => {
      await expectWellFormed(file());
    });

    it("shows the favicon at the bottom right, in line with the name", async () => {
      const { name, logo } = await expectNameAndLogo(file());
      const height = (run: { top: number; bottom: number }) =>
        run.bottom - run.top + 1;
      // Larger than the name's letters, so it reads as a mark, not a letter.
      expect(height(logo)).toBeGreaterThanOrEqual(38);
      expect(height(logo)).toBeLessThanOrEqual(41);
      expect(height(logo)).toBeGreaterThan(1.3 * height(name));
    });
  },
);

/** Posts with titles too long to fit on one line, or at all. */
const longPosts = {
  "many-words":
    "On the Mathematical Powers of the Calculating Engine, with Notes upon the Memoir by the Translator, Being a Full Account of Every Operation It Performs, of the Cards That Direct It, and of the Tables It Computes, Together with Some Reflections on Whether Such a Machine Might One Day Compose Elaborate Pieces of Music",
  "one-long-word":
    "Supercalifragilisticexpialidociousanalyticalenginecomputations",
};

/** A site name too long for one line beside the logo. */
const longName =
  "Augusta Ada King, Countess of Lovelace, Enchantress of Numbers and Analyst";

describe("a Post with a long title, on a site with a long name", () => {
  let build: CopyBuild;
  let dist: string;

  beforeAll(() => {
    build = buildCopy((root) => {
      const config = path.join(root, "src/site.config.ts");
      writeFileSync(
        config,
        readFileSync(config, "utf8").replace(
          'name: "Ada Lovelace"',
          `name: "${longName}"`,
        ),
      );
      for (const [id, title] of Object.entries(longPosts)) {
        writeFileSync(
          path.join(root, "src/content/posts", `${id}.md`),
          `---\ntitle: ${title}\ndescription: A Post with a long title.\ndate: 2026-01-01\n---\n\nLorem ipsum.\n`,
        );
      }
    });
    dist = path.join(build.root, "dist");
  });

  afterAll(() => removeCopy(build.root));

  it("builds", () => {
    expect(build.output).not.toMatch(/error/i);
    expect(build.status).toBe(0);
  });

  it.each(Object.keys(longPosts))(
    "%s gets a share image whose text stays clear of the edges",
    async (id) => {
      await expectWellFormed(shareImageOf(dist, `blog/${id}/index.html`));
    },
  );

  it("wraps the name before it reaches the logo", async () => {
    await expectNameAndLogo(
      shareImageOf(dist, `blog/${Object.keys(longPosts)[0]}/index.html`),
    );
  });
});

describe("a site without a favicon", () => {
  let build: CopyBuild;
  let dist: string;

  beforeAll(() => {
    build = buildCopy((root) => {
      rmSync(path.join(root, "public/favicon.svg"));
    });
    dist = path.join(build.root, "dist");
  });

  afterAll(() => removeCopy(build.root));

  it("builds", () => {
    expect(build.output).not.toMatch(/error/i);
    expect(build.status).toBe(0);
  });

  it("generates share images with the name and no logo", async () => {
    const post = publishedPosts().find((post) => !post.cover);
    const file = shareImageOf(dist, `blog/${post?.id}/index.html`);
    await expectWellFormed(file);
    const ink = await footerInkOf(file);
    const runs = inkRuns(ink.columns);
    expect(runs).toHaveLength(1);
    expect(runs[0].left).toBeLessThan(margin + 4);
    expect(runs[0].right).toBeLessThan(1200 / 2);
  });
});
