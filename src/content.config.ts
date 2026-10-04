import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/** What a frontmatter date that can't be read fails the build with. */
const dateError = { error: "Expected a date like 2026-06-12" };

/**
 * Projects: one Markdown file each in src/content/projects. The file name is
 * the Project's URL, e.g. bernoulli-number-generator.md is served at
 * /projects/bernoulli-number-generator/. A frontmatter field that doesn't
 * match this schema fails the build.
 */
const projects = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** One line, shown on the Project's card and under its title. */
      summary: z.string(),
      /** Orders Projects, newest first. */
      date: z.coerce.date(dateError),
      /** The technologies the Project was built with. */
      stack: z.array(z.string()),
      /** The URL of the Project's source code. */
      repository: z.url().optional(),
      /** The URL where the Project can be tried. */
      live: z.url().optional(),
      /**
       * An image path relative to the Markdown file. It is resized and
       * converted at build time, and treated as decoration.
       */
      cover: image().optional(),
      /** Shows the Project on Home. Home shows the 3 newest featured. */
      featured: z.boolean().default(false),
      /** Shows the Project in the dev server only, never in a build. */
      draft: z.boolean().default(false),
    }),
});

/**
 * Posts: one Markdown file each in src/content/posts. The file name is the
 * Post's URL, e.g. notes-on-note-g.md is served at /blog/notes-on-note-g/. A
 * frontmatter field that doesn't match this schema fails the build.
 */
const posts = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    /** One or two sentences, shown in Post lists and under the title. */
    description: z.string(),
    /** The publish date. Orders Posts, newest first. */
    date: z.coerce.date(dateError),
    /** When the Post last changed meaningfully, if after `date`. */
    updated: z.coerce.date(dateError).optional(),
    /** The Post's Tags. Each Tag gets a page listing the Posts that carry it. */
    tags: z.array(z.string()).default([]),
    /** Shows the Post in the dev server only, never in a build. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects, posts };
