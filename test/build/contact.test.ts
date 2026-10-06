import { describe, expect, it } from "vitest";
import { siteConfig } from "../../src/site.config";
import { readPage, socialHrefs } from "./output";

describe("Contact Section", () => {
  const page = readPage("contact/index.html");
  const links = page.querySelectorAll("main a");

  it("shows Contact as the page heading", () => {
    expect(page.querySelector("main h1")?.textContent.trim()).toBe("Contact");
  });

  it("links the email address from Site config with mailto:", () => {
    expect(siteConfig.social.email).toBeDefined();
    const mailto = links.filter((link) =>
      link.getAttribute("href")?.startsWith("mailto:"),
    );
    expect(mailto.map((link) => link.getAttribute("href"))).toEqual([
      `mailto:${siteConfig.social.email}`,
    ]);
    expect(mailto[0]?.textContent).toContain(siteConfig.social.email);
  });

  it("links exactly the social links set in Site config", () => {
    const hrefs = links.map((link) => link.getAttribute("href"));
    expect(hrefs.toSorted()).toEqual(socialHrefs.toSorted());
  });

  it("names every link with visible text", () => {
    expect(links.filter((link) => !link.textContent.trim())).toEqual([]);
  });
});
