import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getPosts, postPath } from "../lib/posts";
import { absoluteUrl } from "../lib/url";
import { siteConfig } from "../site.config";

/**
 * The RSS feed of every published Post, newest first. Feed readers need
 * absolute URLs, so every link is the site URL plus the base path.
 */
export const GET: APIRoute = async ({ site }) => {
  const posts = await getPosts();
  return rss({
    title: siteConfig.name,
    description: siteConfig.tagline,
    site: absoluteUrl("/", site),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      categories: post.data.tags,
      link: absoluteUrl(postPath(post), site),
    })),
  });
};
