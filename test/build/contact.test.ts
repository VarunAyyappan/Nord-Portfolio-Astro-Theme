import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "node-html-parser";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { siteConfig } from "../../src/site.config";
import { buildCopy, type CopyBuild, removeCopy } from "./build-copy";
import { contactDir, contactSource } from "./content";
import {
  mailtoHref,
  readPage,
  sectionTitled,
  sitePath,
  socialHrefs,
} from "./output";

describe("Contact Section", () => {
  const page = readPage("contact/index.html");
  const links = page.querySelectorAll("main a");

  it("shows Contact as the page heading", () => {
    expect(page.querySelector("main h1")?.textContent.trim()).toBe("Contact");
  });

  it("renders the intro from the Markdown body", () => {
    const { firstParagraph } = contactSource();
    expect(firstParagraph).not.toBe("");
    expect(page.querySelector("main")?.textContent).toContain(firstParagraph);
  });

  it("links the email address from Site config with mailto:", () => {
    const { email } = siteConfig.social;
    expect(email).toBeDefined();
    const mailto = links.filter((link) =>
      link.getAttribute("href")?.startsWith("mailto:"),
    );
    expect(mailto.map((link) => link.getAttribute("href"))).toEqual([
      mailtoHref,
    ]);
    expect(mailto[0]?.textContent).toContain(email?.address);
  });

  it("links exactly the social links set in Site config", () => {
    const hrefs = links.map((link) => link.getAttribute("href"));
    expect(hrefs.toSorted()).toEqual(socialHrefs.toSorted());
  });

  it("names every link with visible text", () => {
    expect(links.filter((link) => !link.textContent.trim())).toEqual([]);
  });
});

describe("Contact details from the filler content", () => {
  const { openTo, responseTime, timezone } = contactSource();
  const page = readPage("contact/index.html");

  it("lists what the Adopter is open to under its own heading, in order", () => {
    expect(openTo.length).toBeGreaterThan(1);
    const items = sectionTitled(page, "Open to")
      ?.querySelectorAll("li")
      .map((item) => item.textContent.trim());
    expect(items).toEqual(openTo);
  });

  it("shows the response time and timezone", () => {
    expect(responseTime).toBeDefined();
    expect(timezone).toBeDefined();
    const text = page.querySelector("main")?.textContent ?? "";
    expect(text).toContain(responseTime);
    expect(text).toContain(timezone);
  });
});

describe("Handles on Contact", () => {
  const { email, ...networks } = siteConfig.social;
  const links = readPage("contact/index.html").querySelectorAll("main a");

  it.each(Object.entries(networks))(
    "shows the %s handle from Site config next to the network name",
    (_, network) => {
      const handle = network?.handle;
      expect(handle).toBeDefined();
      const link = links.find(
        (link) => link.getAttribute("href") === network?.url,
      );
      expect(link?.textContent).toContain(handle);
    },
  );

  it("leaves handles out of the footer", () => {
    const footer =
      readPage("contact/index.html").querySelector("body > footer");
    const handles = Object.values(networks).map((network) => network?.handle);
    for (const handle of handles) {
      expect(footer?.textContent).not.toContain(handle);
    }
  });
});

describe("PGP key, with a fingerprint and no key file", () => {
  const { pgpFingerprint, pgpKey } = contactSource();
  const page = readPage("contact/index.html");

  it("is how the filler content sets it", () => {
    expect(pgpFingerprint).toBeDefined();
    expect(pgpKey).toBeUndefined();
  });

  it("shows the fingerprint and no key link", () => {
    const section = sectionTitled(page, "PGP key");
    expect(section?.textContent).toContain(pgpFingerprint);
    expect(section?.querySelectorAll("a")).toEqual([]);
  });
});

describe("PGP key, with a key file", () => {
  const keyPath = "/pgp-key.asc";
  let build: CopyBuild;
  beforeAll(() => {
    build = buildCopy((root) => {
      const contactFile = path.join(
        root,
        path.relative(process.cwd(), contactDir),
        "contact.md",
      );
      const contact = readFileSync(contactFile, "utf8");
      writeFileSync(
        contactFile,
        contact.replace(/^---\n/, `---\npgpKey: ${keyPath}\n`),
      );
      writeFileSync(
        path.join(root, "public", keyPath),
        "-----BEGIN PGP PUBLIC KEY BLOCK-----\n",
      );
    });
  });
  afterAll(() => removeCopy(build.root));

  it("links the key file under the base path", () => {
    expect(build.status).toBe(0);
    const page = parse(
      readFileSync(path.join(build.root, "dist/contact/index.html"), "utf8"),
    );
    const hrefs = sectionTitled(page, "PGP key")
      ?.querySelectorAll("a")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual([sitePath(keyPath)]);
    expect(
      readFileSync(path.join(build.root, "dist", keyPath), "utf8"),
    ).toContain("PGP PUBLIC KEY");
  });
});
