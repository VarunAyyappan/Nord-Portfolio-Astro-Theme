import { readFileSync } from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";
import { SyntaxValidator } from "fast-xml-validator";
import { describe, expect, it } from "vitest";
import { siteConfig } from "../../src/site.config";
import { publishedPosts } from "./content";
import { basePath, headingAt, outDir } from "./output";

/** Where the RSS feed is built, relative to `outDir`. */
const feedFile = "rss.xml";

/** The deployed site's home URL, with the base path. */
const siteHome = new URL(basePath, siteConfig.url).href;

interface FeedItem {
  title: string;
  link: string;
  guid: string | { "#text": string };
  description: string;
  pubDate: string;
}

describe("RSS feed", () => {
  const xml = readFileSync(path.join(outDir, feedFile), "utf8");
  const feed = new XMLParser({
    ignoreAttributes: false,
    isArray: (name) => name === "item",
  }).parse(xml);
  const channel = feed.rss?.channel;
  const items: FeedItem[] = channel?.item ?? [];

  it("is well-formed XML", () => {
    expect(() => SyntaxValidator.validate(xml)).not.toThrow();
  });

  it("is an RSS 2.0 channel with a title, link and description", () => {
    expect(feed.rss?.["@_version"]).toBe("2.0");
    expect(channel?.title).toBe(siteConfig.name);
    expect(channel?.description).toBe(siteConfig.tagline);
    expect(channel?.link).toBe(siteHome);
  });

  it("lists exactly the published Posts, newest first", () => {
    expect(items.map((item) => item.title)).toEqual(
      publishedPosts().map((post) => post.title),
    );
  });

  it("gives each item its Post's description and publish date", () => {
    expect(
      items.map((item) => ({
        description: item.description,
        date: new Date(item.pubDate).toISOString(),
      })),
    ).toEqual(
      publishedPosts().map((post) => ({
        description: post.description,
        date: post.date.toISOString(),
      })),
    );
  });

  it(`links every item to its Post page under ${siteHome}`, () => {
    const linked = items.map((item) => {
      const guid =
        typeof item.guid === "string" ? item.guid : item.guid["#text"];
      return {
        guidIsLink: guid === item.link,
        heading: item.link.startsWith(siteHome)
          ? headingAt(new URL(item.link).pathname)
          : undefined,
      };
    });
    expect(linked).toEqual(
      items.map((item) => ({ guidIsLink: true, heading: item.title })),
    );
  });
});
