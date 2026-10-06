/**
 * The site path of each Section's page, before the base path. Each must
 * match where its page lives in src/pages, so moving a Section's page means
 * changing its path here too.
 */
export const sectionPaths = {
  home: "/",
  projects: "/projects/",
  blog: "/blog/",
  experience: "/experience/",
  about: "/about/",
  contact: "/contact/",
} as const;
