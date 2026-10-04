import { type CollectionEntry, getCollection } from "astro:content";

export type Project = CollectionEntry<"projects">;

/** How many featured Projects Home shows, at most. */
const featuredLimit = 3;

/**
 * Every Project a Visitor can see, newest first. Drafts are included in the
 * dev server, so the Adopter can preview them, and left out of a build.
 */
export async function getProjects(): Promise<Project[]> {
  const projects = await getCollection(
    "projects",
    ({ data }) => !(import.meta.env.PROD && data.draft),
  );
  return projects.toSorted(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
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
