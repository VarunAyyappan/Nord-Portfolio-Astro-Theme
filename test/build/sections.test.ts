import { describe, expect, it } from "vitest";
import { sectionPaths } from "../../src/lib/sections";
import { siteConfig } from "../../src/site.config";
import { headingAt, sitePath } from "./output";

describe("Section paths", () => {
  it("lead to each Section's page", () => {
    const headings = Object.fromEntries(
      Object.entries(sectionPaths).map(([section, path]) => [
        section,
        headingAt(sitePath(path)),
      ]),
    );
    expect(headings).toEqual({
      home: siteConfig.name,
      projects: "Projects",
      blog: "Blog",
      experience: "Experience",
      about: "About",
      contact: "Contact",
    });
  });
});
