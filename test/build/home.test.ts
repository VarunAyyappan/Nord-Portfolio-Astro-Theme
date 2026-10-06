import { describe, expect, it } from "vitest";
import { siteConfig } from "../../src/site.config";
import { headingAt, readPage, sectionTitled, sitePath } from "./output";

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

describe("call-to-action links in the Home hero", () => {
  const hero = readPage("index.html").querySelector("main > section");
  const hrefs =
    hero?.querySelectorAll("a").map((link) => link.getAttribute("href")) ?? [];

  it("lead to Projects and Contact under the base path", () => {
    expect(hrefs).toEqual([sitePath("/projects/"), sitePath("/contact/")]);
  });

  it("resolve to the Projects and Contact pages", () => {
    expect(hrefs.map((href) => headingAt(href ?? ""))).toEqual([
      "Projects",
      "Contact",
    ]);
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

  it("comes after the Latest Posts", () => {
    const sections = readPage("index.html").querySelectorAll("main > section");
    expect(sections.at(-1)?.querySelector("h2")?.textContent.trim()).toBe(
      "Skills",
    );
  });
});
