import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "node-html-parser";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildCopy, type CopyBuild, removeCopy } from "./build-copy";
import { aboutDir, aboutSource } from "./content";
import { basePath, imageUrls, readPage, unchangedCopies } from "./output";

describe("About Section", () => {
  const page = readPage("about/index.html");

  it("shows About as the page heading", () => {
    expect(page.querySelector("main h1")?.textContent.trim()).toBe("About");
  });

  it("renders the Markdown body", () => {
    expect(page.querySelector("main")?.textContent).toContain(
      aboutSource().firstParagraph,
    );
  });
});

describe("About portrait, when it's set", () => {
  const { portrait } = aboutSource();
  const images = readPage("about/index.html").querySelectorAll("main img");

  it("is set in the filler content", () => {
    expect(portrait).toBeDefined();
  });

  it("is shown once, optimized, with a text alternative", () => {
    expect(images).toHaveLength(1);
    expect(images[0].getAttribute("alt")?.trim()).not.toBe("");
    for (const url of imageUrls(images)) {
      expect(url).toMatch(new RegExp(`^${basePath}_astro/.+\\.webp$`));
    }
  });

  it("is never copied to the output unchanged", () => {
    expect(unchangedCopies([portrait ?? ""])).toEqual([]);
  });
});

describe("About portrait, when it's not set", () => {
  let build: CopyBuild;
  beforeAll(() => {
    build = buildCopy((root) => {
      const aboutFile = path.join(
        root,
        path.relative(process.cwd(), aboutDir),
        "about.md",
      );
      const about = readFileSync(aboutFile, "utf8");
      const withoutPortrait = about.replace(/^portrait\w*:.*\n/gm, "");
      expect(withoutPortrait).not.toBe(about);
      writeFileSync(aboutFile, withoutPortrait);
    });
  });
  afterAll(() => removeCopy(build.root));

  it("is absent from the About page", () => {
    expect(build.status).toBe(0);
    const page = parse(
      readFileSync(path.join(build.root, "dist/about/index.html"), "utf8"),
    );
    expect(page.querySelector("main")?.textContent).toContain(
      aboutSource().firstParagraph,
    );
    expect(page.querySelectorAll("main img")).toEqual([]);
  });
});
