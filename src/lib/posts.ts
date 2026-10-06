import type { CollectionEntry } from "astro:content";
import { getVisible } from "./visible";

export type Post = CollectionEntry<"posts">;

/** How many Posts each Blog index page lists. */
export const postsPerPage = 10;

/** How many of the newest Posts Home shows. */
const latestLimit = 3;

/** Every Post a Visitor can see, newest first. Drafts show in dev only. */
export function getPosts(): Promise<Post[]> {
  return getVisible("posts");
}

/** The newest Posts, for Home. */
export async function getLatestPosts(): Promise<Post[]> {
  const posts = await getPosts();
  return posts.slice(0, latestLimit);
}

/** The site path of the RSS feed, before the base path (src/pages/rss.xml.ts). */
export const feedPath = "/rss.xml";

/** The site path of a Post's page, before the base path. */
export function postPath(post: Post): string {
  return `/blog/${post.id}/`;
}

/** An average adult's silent reading speed. */
const wordsPerMinute = 200;

/**
 * How long a Post takes to read, in whole minutes and at least 1. Computed
 * from the Markdown body when the site is built.
 */
export function readingMinutes(post: Post): number {
  const words = post.body?.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu);
  return Math.max(1, Math.ceil((words?.length ?? 0) / wordsPerMinute));
}

/** A Tag and the Posts that carry it, newest first. */
export interface Tag {
  /** The Tag as the first Post to carry it spells it. */
  name: string;
  /** The Tag's URL segment, e.g. "Analytical Engine" becomes "analytical-engine". */
  slug: string;
  posts: Post[];
}

/** Turns a Tag's name into its URL segment. */
function tagSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Every Tag that a Post a Visitor can see carries, in alphabetical order. A
 * Tag that only drafts carry is left out of a build. Tags whose names differ
 * only in case or punctuation, e.g. "Note G" and "note-g", are one Tag.
 */
export async function getTags(): Promise<Tag[]> {
  const tags = new Map<string, Tag>();
  for (const post of await getPosts()) {
    for (const name of post.data.tags) {
      const slug = tagSlug(name);
      const tag = tags.get(slug) ?? { name, slug, posts: [] };
      tag.posts.push(post);
      tags.set(slug, tag);
    }
  }
  return [...tags.values()].toSorted((a, b) => a.name.localeCompare(b.name));
}

/** The site path of a Tag's page, before the base path. */
export function tagPath(name: string): string {
  return `/blog/tags/${tagSlug(name)}/`;
}
