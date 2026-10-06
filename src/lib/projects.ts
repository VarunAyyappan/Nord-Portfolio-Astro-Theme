import type { CollectionEntry } from "astro:content";
import { sectionPaths } from "./sections";
import { getVisible } from "./visible";

export type Project = CollectionEntry<"projects">;

/** How many published Projects can be featured, at most. */
const featuredLimit = 3;

/**
 * Every Project a Visitor can see, newest first. Drafts show in dev only.
 */
export function getProjects(): Promise<Project[]> {
  return getVisible("projects");
}

/**
 * Every featured Project a Visitor can see, newest first, for Home. More
 * than 3 featured Projects that aren't drafts fails the build, naming them,
 * so the Adopter chooses what Home shows.
 */
export async function getFeaturedProjects(): Promise<Project[]> {
  const projects = await getProjects();
  const featured = projects.filter((project) => project.data.featured);
  // Drafts show in the dev server, but a build leaves them out, so they
  // don't count, and the dev server fails only when a build would.
  const published = featured.filter((project) => !project.data.draft);
  if (published.length > featuredLimit) {
    const names = published
      .map(
        (project) =>
          `${project.data.title} (${project.filePath ?? project.id})`,
      )
      .join(", ");
    throw new Error(
      `Up to ${featuredLimit} Projects can be featured, but ${published.length} are: ${names}. Drafts don't count. Set featured: false on the rest.`,
    );
  }
  return featured;
}

/** The site path of a Project's detail page, before the base path. */
export function projectPath(project: Project): string {
  return `${sectionPaths.projects}${project.id}/`;
}
