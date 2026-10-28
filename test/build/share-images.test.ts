import { writeFileSync } from "node:fs";
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

describe.each(publishedPosts().filter((post) => !post.cover))(
  "$title's generated share image",
  (post) => {
    it("shows text on a Nord background, clear of the edges", async () => {
      await expectWellFormed(
        shareImageOf(outDir, `blog/${post.id}/index.html`),
      );
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

describe("a Post with a long title", () => {
  let build: CopyBuild;
  let dist: string;

  beforeAll(() => {
    build = buildCopy((root) => {
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
});
