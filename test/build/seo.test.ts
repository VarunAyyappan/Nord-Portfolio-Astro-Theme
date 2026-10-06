import path from "node:path";
import { XMLParser } from "fast-xml-parser";
import type { HTMLElement } from "node-html-parser";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { siteConfig } from "../../src/site.config";
import {
  postSources,
  projectSources,
  publishedPosts,
  publishedProjects,
} from "./content";
import {
  basePath,
  htmlFiles,
  outDir,
  pageUrl,
  readOutput,
  readPage,
  resolveToFile,
  siteOrigin,
  sitePath,
} from "./output";

/** The deployed site's home URL, which every absolute URL starts with. */
const siteHome = `${siteOrigin}${basePath}`;

/** The absolute URL of a site path such as "/share.png", under the base path. */
const absoluteUrl = (route: string) =>
  new URL(sitePath(route), siteOrigin).href;

/** The default share image, as an absolute URL. */
const defaultImage = absoluteUrl(siteConfig.shareImage);

/** Where the sitemap index is built, relative to the output directory. */
const sitemapIndexFile = "sitemap-index.xml";

/** The pages a search engine shouldn't index: the 404 page. */
const unlisted = ["404.html"];

/** The `content` of a page's `<meta>` with the given `name` or `property`. */
function meta(page: HTMLElement, key: string) {
  return page
    .querySelector(`head meta[name="${key}"], head meta[property="${key}"]`)
    ?.getAttribute("content");
}

/** The tags in a page's head that link previews and search engines read. */
function headTags(page: HTMLElement) {
  return {
    title: page.querySelector("head title")?.textContent.trim(),
    description: meta(page, "description"),
    canonical: page
      .querySelector('head link[rel="canonical"]')
      ?.getAttribute("href"),
    ogTitle: meta(page, "og:title"),
    ogDescription: meta(page, "og:description"),
    ogImage: meta(page, "og:image"),
    ogUrl: meta(page, "og:url"),
    twitterCard: meta(page, "twitter:card"),
    twitterTitle: meta(page, "twitter:title"),
    twitterDescription: meta(page, "twitter:description"),
    twitterImage: meta(page, "twitter:image"),
  };
}

/** Parses an XML file in the output, given its path in the output directory. */
function readXml(file: string) {
  return new XMLParser({
    isArray: (name) => name === "sitemap" || name === "url",
  }).parse(readOutput(file));
}

/** The URL of each sitemap a sitemap index lists. */
function sitemapsIn(file: string): string[] {
  const index = readXml(file).sitemapindex;
  return (index?.sitemap ?? []).map((entry: { loc: string }) => entry.loc);
}

/** The URL of each page a sitemap lists. */
function pagesIn(file: string): string[] {
  const urlset = readXml(file).urlset;
  return (urlset?.url ?? []).map((entry: { loc: string }) => entry.loc);
}

/** The output file an absolute URL on the deployed site resolves to. */
function fileAt(url: string) {
  const parsed = new URL(url);
  return parsed.origin === siteOrigin
    ? resolveToFile(parsed.pathname)
    : undefined;
}

describe.each(htmlFiles())("%s head tags", (file) => {
  const head = headTags(readPage(file));

  it("has a title and a description", () => {
    expect(head.title).toBeTruthy();
    expect(head.description).toBeTruthy();
  });

  it(`has an absolute canonical URL under ${basePath} that serves this page`, () => {
    expect(head.canonical?.startsWith(siteHome)).toBe(true);
    expect(fileAt(head.canonical ?? "")).toBe(file);
    expect(head.ogUrl).toBe(head.canonical);
  });

  it("has Open Graph and Twitter titles, descriptions and images", () => {
    expect(head.ogTitle).toBeTruthy();
    expect(head.ogDescription).toBe(head.description);
    expect(head.ogImage).toBeTruthy();
    expect(head.twitterCard).toBe("summary_large_image");
    expect(head.twitterTitle).toBe(head.ogTitle);
    expect(head.twitterDescription).toBe(head.description);
    expect(head.twitterImage).toBe(head.ogImage);
  });

  it("has a share image that resolves to a file in the output", () => {
    expect(head.ogImage?.startsWith(siteHome)).toBe(true);
    expect(fileAt(head.ogImage ?? "")).toBeDefined();
  });
});

describe.each(publishedPosts())("$title Post page head tags", (post) => {
  const head = headTags(readPage(`blog/${post.id}/index.html`));

  it("use the Post's title and description", () => {
    expect(head.title).toBe(`${post.title} | ${siteConfig.name}`);
    expect(head.ogTitle).toBe(post.title);
    expect(head.description).toBe(post.description);
  });
});

/** Each published Post and Project with a cover, and the file of its page. */
const withCovers = [
  ...publishedPosts().map((post) => ({
    ...post,
    file: `blog/${post.id}/index.html`,
  })),
  ...publishedProjects().map((project) => ({
    ...project,
    file: `projects/${project.id}/index.html`,
  })),
].filter((entry) => entry.cover);

describe.each(withCovers)("$title page head tags", (entry) => {
  const head = headTags(readPage(entry.file));
  const cover = path.parse(entry.cover ?? "").name;

  it("use a copy of the cover, cropped to preview size, as the share image", async () => {
    expect(head.ogImage).toMatch(
      new RegExp(`^${siteHome}_astro/${cover}\\.[^/]+\\.jpg$`),
    );
    const file = path.join(outDir, fileAt(head.ogImage ?? "") ?? "");
    const { width, height } = await sharp(file).metadata();
    expect({ width, height }).toEqual({ width: 1200, height: 630 });
  });
});

describe("the default share image", () => {
  it("is used by every page but Posts and Projects with a cover", () => {
    const withCover = new Set(withCovers.map((entry) => entry.file));
    const others = htmlFiles().filter((file) => !withCover.has(file));
    expect(others.length).toBeGreaterThan(withCover.size);
    expect(
      others.filter(
        (file) => headTags(readPage(file)).ogImage !== defaultImage,
      ),
    ).toEqual([]);
  });
});

describe("sitemap", () => {
  const sitemaps = sitemapsIn(sitemapIndexFile);
  const listed = sitemaps.flatMap((sitemap) => pagesIn(fileAt(sitemap) ?? ""));

  it("is an index of sitemaps that resolve to files in the output", () => {
    expect(sitemaps.length).toBeGreaterThan(0);
    expect(sitemaps.map(fileAt).filter((file) => !file)).toEqual([]);
  });

  it("lists every published page, at its canonical URL", () => {
    const expected = htmlFiles()
      .filter((file) => !unlisted.includes(file))
      .map((file) => headTags(readPage(file)).canonical);
    expect(listed.toSorted()).toEqual(expected.toSorted());
  });

  it("lists every page at an absolute URL that serves it", () => {
    for (const url of listed) {
      expect(url.startsWith(siteHome)).toBe(true);
      expect(fileAt(url)).toBeDefined();
    }
  });

  it("leaves out every draft", () => {
    const drafts = [
      ...postSources()
        .filter((post) => post.draft)
        .map((post) => `/blog/${post.id}/`),
      ...projectSources()
        .filter((project) => project.draft)
        .map((project) => `/projects/${project.id}/`),
    ];
    expect(drafts.length).toBeGreaterThan(0);
    expect(
      listed.filter((url) => drafts.some((draft) => url.includes(draft))),
    ).toEqual([]);
  });

  it("leaves out the 404 page", () => {
    expect(listed.filter((url) => fileAt(url) === "404.html")).toEqual([]);
  });
});

describe("robots.txt", () => {
  const robots = readOutput("robots.txt");

  it("allows every crawler", () => {
    expect(robots).toMatch(/^User-agent: \*$/m);
    expect(robots).toMatch(/^Allow: \/$/m);
  });

  it("points at the sitemap index", () => {
    const sitemap = robots.match(/^Sitemap: (.+)$/m)?.[1];
    expect(sitemap).toBe(absoluteUrl(`/${sitemapIndexFile}`));
    expect(fileAt(sitemap ?? "")).toBe(sitemapIndexFile);
  });
});

it("serves Home at the canonical URL of the site root", () => {
  expect(headTags(readPage("index.html")).canonical).toBe(
    new URL(pageUrl("index.html"), siteOrigin).href,
  );
});
