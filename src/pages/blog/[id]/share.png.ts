import type { APIRoute, GetStaticPaths } from "astro";
import { getPosts, type Post } from "../../../lib/posts";
import { renderShareImage } from "../../../share-image/render";
import { siteConfig } from "../../../site.config";

/**
 * The share image of each Post without a cover, generated at build time
 * from its title. A Post with a cover shares its cover instead.
 */
export const getStaticPaths = (async () => {
  const posts = await getPosts();
  return posts
    .filter((post) => !post.data.cover)
    .map((post) => ({ params: { id: post.id }, props: { post } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ post: Post }> = async ({ props }) => {
  const image = await renderShareImage({
    title: props.post.data.title,
    siteName: siteConfig.name,
  });
  return new Response(image, { headers: { "Content-Type": "image/png" } });
};
