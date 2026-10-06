import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { type HTMLElement, parse } from "node-html-parser";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { siteConfig } from "../../src/site.config";
import { buildCopy, type CopyBuild, removeCopy } from "./build-copy";
import {
  type EntrySource,
  educationSources,
  experienceSources,
} from "./content";
import {
  outDir,
  readPage,
  resolveToFile,
  sectionTitled,
  sitePath,
} from "./output";

/** Current entries first, then by start date, newest first. */
function inDisplayOrder(entries: EntrySource[]) {
  return entries
    .toSorted(
      (a, b) =>
        Number(Boolean(a.end)) - Number(Boolean(b.end)) ||
        b.start.valueOf() - a.start.valueOf(),
    )
    .map((entry) => entry.title);
}

/** The titles of the entries in a section, in page order. */
function entryTitles(section: HTMLElement | null | undefined) {
  return (
    section
      ?.querySelectorAll("article")
      .map((article) => article.querySelector("h3")?.textContent.trim()) ?? []
  );
}

/** The links in main whose text mentions the résumé. */
function resumeLinks(page: HTMLElement) {
  return page
    .querySelectorAll("main a")
    .filter((link) => /résumé/i.test(link.textContent));
}

describe("Experience Section", () => {
  const page = readPage("experience/index.html");
  const roles = sectionTitled(page, "Roles");
  const education = sectionTitled(page, "Education");

  it("shows Experience as the page heading", () => {
    expect(page.querySelector("main h1")?.textContent.trim()).toBe(
      "Experience",
    );
  });

  it("has 3 roles in the filler content, one of them current", () => {
    const current = experienceSources().filter((entry) => !entry.end);
    expect(current).toHaveLength(1);
    expect(experienceSources()).toHaveLength(3);
  });

  it("lists every Experience entry, current roles first, then newest start first", () => {
    expect(entryTitles(roles)).toEqual(inDisplayOrder(experienceSources()));
  });

  it("shows the current role as running to the present", () => {
    const [current] = roles?.querySelectorAll("article") ?? [];
    expect(current?.querySelectorAll("time")).toHaveLength(1);
    expect(current?.textContent).toContain("Present");
  });

  it("lists every Education entry", () => {
    expect(educationSources().length).toBeGreaterThan(0);
    expect(entryTitles(education)).toEqual(inDisplayOrder(educationSources()));
  });

  it("lists Education after the roles", () => {
    const sections = page.querySelectorAll("main section");
    expect(roles).toBeDefined();
    expect(education).toBeDefined();
    expect(sections.indexOf(education as HTMLElement)).toBeGreaterThan(
      sections.indexOf(roles as HTMLElement),
    );
  });
});

describe("résumé link, when Site config sets a résumé", () => {
  const links = resumeLinks(readPage("experience/index.html"));
  const href = links[0]?.getAttribute("href") ?? "";

  it("is set in the filler Site config", () => {
    expect(siteConfig.resume).toBeDefined();
  });

  it("appears once on the Experience page", () => {
    expect(links).toHaveLength(1);
    expect(href).toBe(sitePath(siteConfig.resume ?? ""));
  });

  it("resolves to a PDF", () => {
    const file = resolveToFile(href);
    expect(file).toBeDefined();
    const bytes = readFileSync(path.join(outDir, file ?? ""));
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  });
});

describe("résumé link, when Site config sets no résumé", () => {
  let build: CopyBuild;
  beforeAll(() => {
    build = buildCopy((root) => {
      const configFile = path.join(root, "src/site.config.ts");
      const config = readFileSync(configFile, "utf8");
      const withoutResume = config.replace(/^\s*resume:.*\n/m, "\n");
      expect(withoutResume).not.toBe(config);
      writeFileSync(configFile, withoutResume);
    });
  });
  afterAll(() => removeCopy(build.root));

  it("is absent from the Experience page", () => {
    expect(build.status).toBe(0);
    const page = parse(
      readFileSync(path.join(build.root, "dist/experience/index.html"), "utf8"),
    );
    expect(page.querySelector("main h1")?.textContent.trim()).toBe(
      "Experience",
    );
    expect(resumeLinks(page)).toEqual([]);
    expect(page.querySelectorAll('main a[href$=".pdf"]')).toEqual([]);
  });
});
