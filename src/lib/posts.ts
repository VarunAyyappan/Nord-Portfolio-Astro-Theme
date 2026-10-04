import { type CollectionEntry, getCollection } from "astro:content";

export type Post = CollectionEntry<"posts">;

/** How many Posts each Blog index page lists. */
export const postsPerPage = 10;

/** How many of the newest Posts Home shows. */
const latestLimit = 3;

/**
 * Every Post a Visitor can see, newest first. Drafts are included in the dev
 * server, so the Adopter can preview them, and left out of a build.
 */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection(
    "posts",
    ({ data }) => !(import.meta.env.PROD && data.draft),
  );
  return posts.toSorted(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
}

/** The newest Posts, for Home. */
export async function getLatestPosts(): Promise<Post[]> {
  const posts = await getPosts();
  return posts.slice(0, latestLimit);
}

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
