import type { APIRoute } from "astro";
import { absoluteUrl } from "../lib/url";

/** The site path of the sitemap index @astrojs/sitemap builds. */
const sitemapPath = "/sitemap-index.xml";

/**
 * Lets every crawler in and points it at the sitemap. Crawlers only read
 * robots.txt at the root of a domain, so on a project site under a base
 * path it takes effect only once the site moves to a domain of its own.
 */
export const GET: APIRoute = ({ site }) => {
  const sitemap = absoluteUrl(sitemapPath, site);
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`);
};
