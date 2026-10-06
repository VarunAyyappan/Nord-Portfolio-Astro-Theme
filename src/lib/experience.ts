import { type CollectionEntry, getCollection } from "astro:content";

export type ExperienceEntry = CollectionEntry<"experience">;
export type EducationEntry = CollectionEntry<"education">;

/** An Experience or Education entry's dates. No end means it's ongoing. */
interface Dated {
  data: { start: Date; end?: Date };
}

/** Ongoing entries, with no end, first. Then by start date, newest first. */
function byDisplayOrder(a: Dated, b: Dated): number {
  const ongoing = Number(!b.data.end) - Number(!a.data.end);
  return ongoing || b.data.start.valueOf() - a.data.start.valueOf();
}

/** Every Experience entry: current roles first, then newest start first. */
export async function getExperience(): Promise<ExperienceEntry[]> {
  const entries = await getCollection("experience");
  return entries.toSorted(byDisplayOrder);
}

/** Every Education entry, in the same order as Experience entries. */
export async function getEducation(): Promise<EducationEntry[]> {
  const entries = await getCollection("education");
  return entries.toSorted(byDisplayOrder);
}
