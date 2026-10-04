import { describe, expect, it } from "vitest";
import { postSources, publishedPosts } from "./content";
import { outputFiles, readPage } from "./output";

/** What a Tag page's heading says before the Tag's name. */
const headingPrefix = "Posts tagged ";

/** Every built Tag page, keyed by the Tag its heading names. */
function tagPages() {
  return new Map(
    outputFiles()
      .filter((file) => /^blog\/tags\/[^/]+\/index\.html$/.test(file))
      .map((file) => {
        const heading = readPage(file).querySelector("main h1");
        const tag = heading?.textContent.trim().replace(headingPrefix, "");
        return [tag, file] as const;
      }),
  );
}

/** Every Tag carried by at least one of the given Posts. */
const tagsOf = (posts: { tags: string[] }[]) =>
  new Set(posts.flatMap((post) => post.tags));

describe("Tag pages", () => {
  const published = publishedPosts();
  const pages = tagPages();

  it("exist for every Tag a published Post carries, and no others", () => {
    expect(new Set(pages.keys())).toEqual(tagsOf(published));
  });

  it("leave out a Tag that only the draft Post carries", () => {
    const publishedTags = tagsOf(published);
    const draftOnly = [
      ...tagsOf(postSources().filter((post) => post.draft)),
    ].filter((tag) => !publishedTags.has(tag));
    expect(draftOnly.length).toBeGreaterThan(0);
    for (const tag of draftOnly) {
      expect(pages.has(tag)).toBe(false);
    }
  });

  it("are never linked from a Project, whose Stack isn't made of Tags", () => {
    const projectLinksToTags = outputFiles()
      .filter((file) => file.startsWith("projects/") && file.endsWith(".html"))
      .flatMap((file) => readPage(file).querySelectorAll("main a"))
      .map((link) => link.getAttribute("href") ?? "")
      .filter((href) => href.includes("/blog/tags/"));
    expect(projectLinksToTags).toEqual([]);
  });

  it.each([...tagsOf(published)])(
    "%s lists exactly its published Posts, newest first",
    (tag) => {
      const file = pages.get(tag) ?? "";
      const titles = readPage(file)
        .querySelectorAll("main article")
        .map((post) => post.querySelector("h2")?.textContent.trim());
      expect(titles).toEqual(
        published
          .filter((post) => post.tags.includes(tag))
          .map((post) => post.title),
      );
    },
  );
});
