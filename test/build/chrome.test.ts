import { describe, expect, it } from "vitest";
import { siteConfig } from "../../src/site.config";
import { basePath, htmlFiles, outputFiles, readPage } from "./output";

/** Where a Site config navigation entry should link under the base path. */
const navTargets = siteConfig.navigation.map(({ label, href }) => ({
  label,
  href: `${basePath}${href.replace(/^\//, "")}`,
}));

/** The footer links Site config asks for: only the social links it sets. */
const socialTargets = Object.entries(siteConfig.social)
  .filter(([, value]) => value)
  .map(([network, value]) =>
    network === "email" ? `mailto:${value}` : String(value),
  );

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

    it("lists exactly the Site config navigation in the header nav", () => {
      const links = page
        .querySelectorAll("body > header nav a")
        .map((link) => ({
          label: link.textContent.trim(),
          href: link.getAttribute("href"),
        }));
      expect(links).toEqual(navTargets);
    });

    it("links exactly the social links set in Site config in the footer", () => {
      const hrefs = page
        .querySelectorAll("body > footer a")
        .map((link) => link.getAttribute("href"));
      expect(hrefs.toSorted()).toEqual(socialTargets.toSorted());
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
