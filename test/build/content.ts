import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/** Where the Adopter writes Projects, one Markdown file each. */
export const projectsDir = path.resolve("src/content/projects");

/** Where the Adopter writes Posts, one Markdown file each. */
export const postsDir = path.resolve("src/content/posts");

/** The frontmatter fields the tests read from a Project's Markdown file. */
export interface ProjectSource {
  /** The file name without `.md`, which is the Project's id in its URL. */
  id: string;
  title: string;
  date: Date;
  featured: boolean;
  draft: boolean;
  repository?: string;
  live?: string;
  /** The absolute path of the cover image file, if there is one. */
  cover?: string;
  /** The first paragraph of the Markdown body, as plain text. */
  firstParagraph: string;
}

/**
 * Reads one top-level `key: value` line from YAML frontmatter. The filler
 * content keeps its frontmatter flat, so this is all the tests need.
 */
function field(frontmatter: string, key: string): string | undefined {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match?.[1].trim().replace(/^(["'])(.*)\1$/, "$2");
}

/** Reads a flow-style YAML list, e.g. `tags: [Astro, Notes]`. */
function listField(frontmatter: string, key: string): string[] {
  const value = field(frontmatter, key);
  return (
    value
      ?.replace(/^\[|\]$/g, "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

/** Each Markdown file in `dir`, split into its id, frontmatter and body. */
function markdownFiles(dir: string) {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const source = readFileSync(path.join(dir, file), "utf8");
      const [, frontmatter = "", body = ""] =
        source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
      return { id: file.replace(/\.md$/, ""), frontmatter, body };
    });
}

/** The first paragraph of a Markdown body, as plain text. */
function firstParagraph(body: string): string {
  const [paragraph] = body.trim().split(/\n\s*\n/);
  // A link's text is all that shows, e.g. "[Astro](https://astro.build)".
  return paragraph.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
}

/** Every Project in the content folder, drafts included. */
export function projectSources(): ProjectSource[] {
  return markdownFiles(projectsDir).map(({ id, frontmatter, body }) => {
    const cover = field(frontmatter, "cover");
    return {
      id,
      title: field(frontmatter, "title") ?? "",
      date: new Date(field(frontmatter, "date") ?? ""),
      featured: field(frontmatter, "featured") === "true",
      draft: field(frontmatter, "draft") === "true",
      repository: field(frontmatter, "repository"),
      live: field(frontmatter, "live"),
      cover: cover && path.resolve(projectsDir, cover),
      firstParagraph: firstParagraph(body),
    };
  });
}

/** The Projects a build publishes: every one that isn't a draft. */
export function publishedProjects(): ProjectSource[] {
  return projectSources().filter((project) => !project.draft);
}

/** The frontmatter fields the tests read from a Post's Markdown file. */
export interface PostSource {
  /** The file name without `.md`, which is the Post's id in its URL. */
  id: string;
  title: string;
  description: string;
  date: Date;
  updated?: Date;
  tags: string[];
  draft: boolean;
  /** The Markdown body, as written. */
  body: string;
  /** The first paragraph of the Markdown body, as plain text. */
  firstParagraph: string;
}

/** Every Post in the content folder, drafts included. */
export function postSources(): PostSource[] {
  return markdownFiles(postsDir).map(({ id, frontmatter, body }) => {
    const updated = field(frontmatter, "updated");
    return {
      id,
      title: field(frontmatter, "title") ?? "",
      description: field(frontmatter, "description") ?? "",
      date: new Date(field(frontmatter, "date") ?? ""),
      updated: updated ? new Date(updated) : undefined,
      tags: listField(frontmatter, "tags"),
      draft: field(frontmatter, "draft") === "true",
      body,
      firstParagraph: firstParagraph(body),
    };
  });
}

/** The Posts a build publishes, newest first: every one that isn't a draft. */
export function publishedPosts(): PostSource[] {
  return postSources()
    .filter((post) => !post.draft)
    .toSorted((a, b) => b.date.valueOf() - a.date.valueOf());
}
