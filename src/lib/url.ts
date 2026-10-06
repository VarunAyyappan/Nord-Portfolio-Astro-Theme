/** Adds a trailing slash to a path that doesn't end with one. */
export function withTrailingSlash(path: string): string {
  return path.replace(/\/?$/, "/");
}

/** The base path with a trailing slash, e.g. "/Nord-Portfolio-Astro-Theme/". */
export const base = withTrailingSlash(import.meta.env.BASE_URL);

/**
 * Prefixes a site path such as "/" or "/projects/" with the base path, so
 * links work wherever the site is deployed.
 */
export function withBase(path: string): string {
  return `${base}${path.replace(/^\//, "")}`;
}

/**
 * The absolute URL of a site path such as "/rss.xml" on the deployed site,
 * with the base path added, for feed readers, crawlers and link previews.
 * `site` is the `site` Astro reads from the config.
 */
export function absoluteUrl(path: string, site: URL | undefined): string {
  return new URL(withBase(path), site).href;
}
