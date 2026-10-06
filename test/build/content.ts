import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/** Where the Adopter writes Projects, one Markdown file each. */
export const projectsDir = path.resolve("src/content/projects");

/** Where the Adopter writes Posts, one Markdown file each. */
export const postsDir = path.resolve("src/content/posts");

/** Where the Adopter writes Experience entries, one YAML file each. */
export const experienceDir = path.resolve("src/content/experience");

/** Where the Adopter writes Education entries, one YAML file each. */
export const educationDir = path.resolve("src/content/education");

/** Where the Adopter writes the About Section, as about.md. */
export const aboutDir = path.resolve("src/content/about");

/** Where the Adopter writes the Contact Section, as contact.md. */
export const contactDir = path.resolve("src/content/contact");

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
 * Reads one top-level `key: value` line from YAML: Markdown frontmatter or a
 * whole data file. The tests only read flat fields, so this is all they need.
 */
function field(yaml: string, key: string): string | undefined {
  const match = yaml.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
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

/** Each YAML file in `dir`, as its id and its text. */
function yamlFiles(dir: string) {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".yaml"))
    .map((file) => ({
      id: file.replace(/\.yaml$/, ""),
      source: readFileSync(path.join(dir, file), "utf8"),
    }));
}

/** The fields the tests read from an Experience or Education entry. */
export interface EntrySource {
  /** The file name without `.yaml`. */
  id: string;
  /** The role, or the qualification for an Education entry. */
  title: string;
  start: Date;
  /** Left out for a current role or a course still in progress. */
  end?: Date;
}

/** Reads the dates of an Experience or Education entry. */
function entryDates(source: string) {
  const end = field(source, "end");
  return {
    start: new Date(field(source, "start") ?? ""),
    end: end ? new Date(end) : undefined,
  };
}

/** Every Experience entry in the content folder. */
export function experienceSources(): EntrySource[] {
  return yamlFiles(experienceDir).map(({ id, source }) => ({
    id,
    title: field(source, "role") ?? "",
    ...entryDates(source),
  }));
}

/** Every Education entry in the content folder. */
export function educationSources(): EntrySource[] {
  return yamlFiles(educationDir).map(({ id, source }) => ({
    id,
    title: field(source, "qualification") ?? "",
    ...entryDates(source),
  }));
}

/** What the tests read from the About Section's Markdown file. */
export interface AboutSource {
  /** The absolute path of the portrait image file, if there is one. */
  portrait?: string;
  /** The first paragraph of the Markdown body, as plain text. */
  firstParagraph: string;
}

/** The About Section's Markdown file. */
export function aboutSource(): AboutSource {
  const [about] = markdownFiles(aboutDir);
  const portrait = field(about.frontmatter, "portrait");
  return {
    portrait: portrait && path.resolve(aboutDir, portrait),
    firstParagraph: firstParagraph(about.body),
  };
}

/** What the tests read from the Contact Section's Markdown file. */
export interface ContactSource {
  /** The kinds of work the Adopter is open to. */
  openTo: string[];
  responseTime?: string;
  timezone?: string;
  pgpFingerprint?: string;
  /** The public key file's path on the site, e.g. "/pgp-key.asc". */
  pgpKey?: string;
  /** The first paragraph of the Markdown body, as plain text. */
  firstParagraph: string;
}

/** The Contact Section's Markdown file. */
export function contactSource(): ContactSource {
  const [contact] = markdownFiles(contactDir);
  return {
    openTo: listField(contact.frontmatter, "openTo"),
    responseTime: field(contact.frontmatter, "responseTime"),
    timezone: field(contact.frontmatter, "timezone"),
    pgpFingerprint: field(contact.frontmatter, "pgpFingerprint"),
    pgpKey: field(contact.frontmatter, "pgpKey"),
    firstParagraph: firstParagraph(contact.body),
  };
}
