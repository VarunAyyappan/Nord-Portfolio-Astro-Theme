import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getPosts, postPath } from "../lib/posts";
import { withBase } from "../lib/url";
import { siteConfig } from "../site.config";

/**
 * The RSS feed of every published Post, newest first. Feed readers need
 * absolute URLs, so every link is the site URL plus the base path.
 */
export const GET: APIRoute = async ({ site }) => {
  const posts = await getPosts();
  /** The absolute URL of a site path, with the base path added. */
  const absolute = (path: string) => new URL(withBase(path), site).href;
  return rss({
    title: siteConfig.name,
    description: siteConfig.tagline,
    site: absolute("/"),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      categories: post.data.tags,
      link: absolute(postPath(post)),
    })),
  });
};
