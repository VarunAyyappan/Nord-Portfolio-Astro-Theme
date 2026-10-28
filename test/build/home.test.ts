import path from "node:path";
import { parse } from "node-html-parser";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { siteConfig } from "../../src/site.config";
import { buildWithFeatured, type CopyBuild, removeCopy } from "./build-copy";
import {
  headingAt,
  heroOf,
  readOutput,
  readPage,
  sectionTitled,
  sitePath,
} from "./output";

describe("Home", () => {
  const home = readPage("index.html");

  it("shows the name as the page heading", () => {
    expect(home.querySelector("h1")?.textContent.trim()).toBe(siteConfig.name);
  });

  it("shows the tagline and intro", () => {
    const text = home.querySelector("main")?.textContent ?? "";
    expect(text).toContain(siteConfig.tagline);
    expect(text).toContain(siteConfig.intro);
  });

  it("includes the name in the document title", () => {
    expect(home.querySelector("title")?.textContent).toContain(siteConfig.name);
  });
});

describe("the call-to-action link in the Home hero", () => {
  const hrefs =
    heroOf(readPage("index.html"))
      ?.querySelectorAll("a")
      .map((link) => link.getAttribute("href")) ?? [];

  it("is the hero's only link, and leads to Contact under the base path", () => {
    expect(hrefs).toEqual([sitePath("/contact/")]);
  });

  it("resolves to the Contact page", () => {
    expect(hrefs.map((href) => headingAt(href ?? ""))).toEqual(["Contact"]);
  });
});

describe("Skills on Home", () => {
  const skills = sectionTitled(readPage("index.html"), "Skills");

  it("has more than one Skill group in the filler Site config", () => {
    expect(siteConfig.skills.length).toBeGreaterThan(1);
  });

  it("shows each Skill group under its heading, in Site config order", () => {
    expect(skills).toBeDefined();
    const shown = skills?.querySelectorAll("h3").map((heading) => ({
      heading: heading.textContent.trim(),
      skills:
        heading.nextElementSibling
          ?.querySelectorAll("li")
          .map((item) => item.textContent.trim()) ?? [],
    }));
    expect(shown).toEqual(siteConfig.skills);
  });

  it("comes last, after the featured Projects and the Latest Posts", () => {
    const headings = readPage("index.html")
      .querySelectorAll("main h2")
      .map((heading) => heading.textContent.trim());
    expect(headings).toEqual(["Featured Projects", "Latest Posts", "Skills"]);
  });
});

describe("Home with no featured Projects", () => {
  let build: CopyBuild | undefined;

  beforeAll(() => {
    build = buildWithFeatured({ published: 0, drafts: 0 });
  });

  afterAll(() => {
    if (build) removeCopy(build.root);
  });

  it("leaves out the featured Projects and All Projects, and keeps the rest", () => {
    expect(build?.status).toBe(0);
    const home = parse(
      readOutput("index.html", path.join(build?.root ?? "", "dist")),
    );
    expect(
      home
        .querySelectorAll("main h2")
        .map((heading) => heading.textContent.trim()),
    ).toEqual(["Latest Posts", "Skills"]);
    expect(
      home
        .querySelectorAll("main a")
        .filter((link) => link.textContent.trim() === "All Projects"),
    ).toEqual([]);
    expect(heroOf(home)?.textContent).toContain(siteConfig.intro);
  });
});
