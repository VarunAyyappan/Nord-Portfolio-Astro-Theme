import { describe, expect, it } from "vitest";
import { colorModeStorageKey } from "../../src/lib/color-mode";
import { siteConfig } from "../../src/site.config";
import {
  basePath,
  htmlFiles,
  outputFiles,
  readPage,
  resolveToFile,
  sitePath,
  socialHrefs,
} from "./output";

/** Where a Site config navigation entry should link under the base path. */
const navTargets = siteConfig.navigation.map(({ label, href }) => ({
  label,
  href: sitePath(href),
}));

/** Where the footer's RSS link should point under the base path. */
const feedHref = sitePath("/rss.xml");

describe("site chrome", () => {
  it("builds a 404 page", () => {
    expect(outputFiles()).toContain("404.html");
  });

  it("links back Home from the 404 page", () => {
    const links = readPage("404.html").querySelectorAll("main a");
    expect(links.map((link) => link.getAttribute("href"))).toContain(basePath);
  });

  it("marks the current Section in the nav", () => {
    const current = readPage("index.html").querySelectorAll(
      'body > header nav a[aria-current="page"]',
    );
    expect(current.map((link) => link.textContent.trim())).toEqual(["Home"]);
  });

  it("leaves out the social link the filler Site config omits", () => {
    const hrefs = readPage("index.html")
      .querySelectorAll("body > footer a")
      .map((link) => link.getAttribute("href") ?? "");
    expect(hrefs.filter((href) => /\/\/(x|twitter)\.com\b/.test(href))).toEqual(
      [],
    );
  });

  describe.each(htmlFiles())("%s", (file) => {
    const page = readPage(file);

    it("has header, main and footer landmarks", () => {
      expect(page.querySelectorAll("body > header")).toHaveLength(1);
      expect(page.querySelectorAll("body > main#main")).toHaveLength(1);
      expect(page.querySelectorAll("body > footer")).toHaveLength(1);
    });

    it("starts with a skip link to the main content", () => {
      const firstFocusable = page.querySelector(
        "body a[href], body button, body input, body select, body textarea, body [tabindex]",
      );
      expect(firstFocusable?.getAttribute("href")).toBe("#main");
      expect(firstFocusable?.textContent.trim()).toMatch(/skip/i);
    });

    it("links the Adopter's name in the header to Home", () => {
      const nameLink = page.querySelector("body > header a");
      expect(nameLink?.textContent.trim()).toBe(siteConfig.name);
      expect(nameLink?.getAttribute("href")).toBe(basePath);
    });

    it("has a color mode toggle in the header", () => {
      const toggle = page.querySelector(
        "body > header button.color-mode-toggle",
      );
      expect(toggle?.textContent).toContain("Color mode: system");
    });

    it("applies the saved color mode from a blocking inline script in the head", () => {
      // A classic inline script with no async, defer or type="module" runs
      // as soon as it is parsed, before <body> can be painted.
      const blocking = page
        .querySelectorAll("head script")
        .filter(
          (script) =>
            script.text.includes(colorModeStorageKey) &&
            !["src", "async", "defer", "type"].some((attribute) =>
              script.hasAttribute(attribute),
            ),
        );
      expect(blocking).toHaveLength(1);
    });

    it("lists exactly the Site config navigation in the header nav", () => {
      const links = page
        .querySelectorAll("body > header nav a")
        .map((link) => ({
          label: link.textContent.trim(),
          href: link.getAttribute("href"),
        }));
      expect(links).toEqual(navTargets);
    });

    it("links exactly the social links set in Site config, and the RSS feed, in the footer", () => {
      const hrefs = page
        .querySelectorAll("body > footer a")
        .map((link) => link.getAttribute("href"));
      expect(hrefs.toSorted()).toEqual([...socialHrefs, feedHref].toSorted());
    });

    it("lets feed readers discover the RSS feed from the head", () => {
      const alternates = page
        .querySelectorAll(
          'head link[rel="alternate"][type="application/rss+xml"]',
        )
        .map((link) => link.getAttribute("href"));
      expect(alternates).toEqual([feedHref]);
    });

    it("links the RSS feed from the footer with the RSS icon", () => {
      const feedLink = page.querySelector(
        'body > footer a[aria-label="RSS feed"]',
      );
      expect(feedLink?.getAttribute("href")).toBe(feedHref);
      expect(resolveToFile(feedHref)).toBe("rss.xml");
      expect(feedLink?.querySelector("svg")).not.toBeNull();
    });

    it("gives every icon-only footer link an accessible name", () => {
      const unnamed = page
        .querySelectorAll("body > footer a")
        .filter(
          (link) =>
            !link.getAttribute("aria-label")?.trim() &&
            !link.textContent.trim(),
        );
      expect(unnamed).toEqual([]);
      const exposedIcons = page.querySelectorAll(
        'body > footer a svg:not([aria-hidden="true"])',
      );
      expect(exposedIcons).toEqual([]);
    });
  });
});
