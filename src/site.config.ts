/**
 * Site config: the single place where an Adopter sets their identity.
 *
 * `url` and `base` decide where the built site is deployed. For a GitHub
 * Pages user site or a custom domain, set `base` to "/". For a project site
 * (https://<user>.github.io/<repo>/), set `base` to "/<repo>".
 */
export interface SiteConfig {
  /** The Adopter's name, shown in the hero and the page title. */
  name: string;
  /** A one-line description of what the Adopter does. */
  tagline: string;
  /** A short introduction shown under the tagline on Home. */
  intro: string;
  /** The origin the site is deployed to, without a trailing slash. */
  url: string;
  /** The path the site is served under, starting with "/". */
  base: string;
}

export const siteConfig: SiteConfig = {
  name: "Ada Lovelace",
  tagline: "Analyst, metaphysician and founder of scientific computing.",
  intro:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
  url: "https://varunayyappan.github.io",
  base: "/Nord-Portfolio-Astro-Theme",
};
