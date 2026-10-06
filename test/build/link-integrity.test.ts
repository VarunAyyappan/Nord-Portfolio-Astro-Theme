import { describe, expect, it } from "vitest";
import {
  basePath,
  htmlFiles,
  pageUrl,
  readPage,
  resolveToFile,
  siteOrigin,
} from "./output";

/** Internal URLs referenced by `href`, `src` and `srcset` on a built page. */
function internalUrls(file: string): string[] {
  const page = readPage(file);
  const urls = page
    .querySelectorAll("[href], [src], [srcset]")
    .flatMap((element) => [
      element.getAttribute("href"),
      element.getAttribute("src"),
      ...(element
        .getAttribute("srcset")
        ?.split(",")
        .map((candidate) => candidate.trim().split(/\s+/)[0]) ?? []),
    ])
    .filter((value): value is string => value !== undefined && value !== "");

  const pageHref = new URL(pageUrl(file), siteOrigin);
  return (
    urls
      .map((value) => new URL(value, pageHref))
      // Absolute links to the deployed site count as internal too.
      .filter((url) => url.origin === siteOrigin)
      .map((url) => url.pathname)
  );
}

describe("link integrity", () => {
  const files = htmlFiles();

  it("finds built HTML pages", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  describe.each(files)("%s", (file) => {
    it(`resolves every internal href, src and srcset to a file under ${basePath}`, () => {
      const broken = internalUrls(file).filter(
        (urlPath) => resolveToFile(urlPath) === undefined,
      );
      expect(broken).toEqual([]);
    });
  });
});
