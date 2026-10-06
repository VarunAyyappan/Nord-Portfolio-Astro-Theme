import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "node-html-parser";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { availabilityLabels } from "../../src/lib/availability";
import { siteConfig } from "../../src/site.config";
import { buildCopy, type CopyBuild, removeCopy } from "./build-copy";
import { readOutput } from "./output";

/** The text of Contact's main content and of the Home hero, in a build. */
function shownIn(readFile: (file: string) => string) {
  return {
    contact: parse(readFile("contact/index.html")).querySelector("main")
      ?.textContent,
    hero: parse(readFile("index.html")).querySelector("main > section")
      ?.textContent,
  };
}

describe("Availability, when it's set", () => {
  const shown = shownIn(readOutput);

  const { availability } = siteConfig;

  it("is set in the filler Site config", () => {
    expect(availability).toBeDefined();
  });

  it.each(["contact", "hero"] as const)("shows its label on %s", (place) => {
    if (!availability) throw new Error("Availability isn't set");
    expect(shown[place]).toContain(availabilityLabels[availability]);
  });
});

describe("Availability, when it's not set", () => {
  let build: CopyBuild;
  beforeAll(() => {
    build = buildCopy((root) => {
      const configFile = path.join(root, "src/site.config.ts");
      const config = readFileSync(configFile, "utf8");
      const withoutAvailability = config.replace(/^ {2}availability:.*\n/m, "");
      expect(withoutAvailability).not.toBe(config);
      writeFileSync(configFile, withoutAvailability);
    });
  });
  afterAll(() => removeCopy(build.root));

  it("shows no label on Contact or in the Home hero", () => {
    expect(build.status).toBe(0);
    const shown = shownIn((file) =>
      readFileSync(path.join(build.root, "dist", file), "utf8"),
    );
    expect(shown.contact).toContain("Contact");
    expect(shown.hero).toContain(siteConfig.tagline);
    for (const label of Object.values(availabilityLabels)) {
      expect(shown.contact).not.toContain(label);
      expect(shown.hero).not.toContain(label);
    }
  });
});
