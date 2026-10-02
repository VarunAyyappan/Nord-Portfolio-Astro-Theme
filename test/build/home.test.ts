import { describe, expect, it } from "vitest";
import { siteConfig } from "../../src/site.config";
import { readPage } from "./output";

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
