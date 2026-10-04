import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/** Where the Adopter writes Projects, one Markdown file each. */
export const projectsDir = path.resolve("src/content/projects");

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

/** Every Project in the content folder, drafts included. */
export function projectSources(): ProjectSource[] {
  return readdirSync(projectsDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const source = readFileSync(path.join(projectsDir, file), "utf8");
      const [, frontmatter = "", body = ""] =
        source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
      const cover = field(frontmatter, "cover");
      return {
        id: file.replace(/\.md$/, ""),
        title: field(frontmatter, "title") ?? "",
        date: new Date(field(frontmatter, "date") ?? ""),
        featured: field(frontmatter, "featured") === "true",
        draft: field(frontmatter, "draft") === "true",
        repository: field(frontmatter, "repository"),
        live: field(frontmatter, "live"),
        cover: cover && path.resolve(projectsDir, cover),
        firstParagraph: body.trim().split(/\n\s*\n/)[0],
      };
    });
}

/** The Projects a build publishes: every one that isn't a draft. */
export function publishedProjects(): ProjectSource[] {
  return projectSources().filter((project) => !project.draft);
}
