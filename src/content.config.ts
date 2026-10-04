import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

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
      date: z.coerce.date({ error: "Expected a date like 2026-06-12" }),
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

export const collections = { projects };
