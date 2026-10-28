import type { CollectionEntry } from "astro:content";
import { sectionPaths } from "./sections";
import type { SitePath } from "./site-path";
import { getVisible } from "./visible";

export type Project = CollectionEntry<"projects">;

/**
 * Every Project a Visitor can see, newest first. Drafts show in dev only.
 */
export function getProjects(): Promise<Project[]> {
  return getVisible("projects");
}

/**
 * Every featured Project a Visitor can see, newest first, for Home. Any
 * number can be featured, and drafts show in dev only, like any other.
 */
export async function getFeaturedProjects(): Promise<Project[]> {
  const projects = await getProjects();
  return projects.filter((project) => project.data.featured);
}

/** The site path of a Project's detail page, before the base path. */
export function projectPath(project: Project): SitePath {
  return `${sectionPaths.projects}${project.id}/`;
}
