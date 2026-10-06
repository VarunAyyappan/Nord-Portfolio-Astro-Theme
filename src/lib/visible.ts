import { type CollectionEntry, getCollection } from "astro:content";

/** The collections that are dated and can hold drafts: Posts and Projects. */
type Draftable = "posts" | "projects";

/**
 * Every Post or Project in a collection that a Visitor can see, newest
 * first. Drafts are included in the dev server, so the Adopter can preview
 * them, and left out of a build.
 */
export async function getVisible<C extends Draftable>(
  collection: C,
): Promise<CollectionEntry<C>[]> {
  const entries = await getCollection(
    collection,
    ({ data }) => !(import.meta.env.PROD && data.draft),
  );
  return entries.toSorted(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
}
