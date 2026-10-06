import type { CollectionEntry } from "astro:content";
import { getVisible } from "./visible";

export type Project = CollectionEntry<"projects">;

/** How many featured Projects Home shows, at most. */
const featuredLimit = 3;

/**
 * Every Project a Visitor can see, newest first. Drafts show in dev only.
 */
export function getProjects(): Promise<Project[]> {
  return getVisible("projects");
}

/** The newest featured Projects, for Home. */
export async function getFeaturedProjects(): Promise<Project[]> {
  const projects = await getProjects();
  return projects
    .filter((project) => project.data.featured)
    .slice(0, featuredLimit);
}

/** The site path of a Project's detail page, before the base path. */
export function projectPath(project: Project): string {
  return `/projects/${project.id}/`;
}
