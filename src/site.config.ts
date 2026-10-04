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
  /** The header links, in order. Remove an entry to hide that Section. */
  navigation: NavLink[];
  /** Links to the Adopter elsewhere. */
  social: SocialLinks;
}

/** A link in the header navigation. */
export interface NavLink {
  /** The text shown for the link. */
  label: string;
  /** A path on this site, starting with "/". The base path is added for you. */
  href: string;
}

/**
 * Links to the Adopter elsewhere, shown as icons in the footer. Leave one out
 * and its icon disappears.
 */
export interface SocialLinks {
  /** Profile URLs. */
  github?: string;
  linkedin?: string;
  mastodon?: string;
  bluesky?: string;
  x?: string;
  /** An email address, linked with mailto:. */
  email?: string;
}

export const siteConfig: SiteConfig = {
  name: "Ada Lovelace",
  tagline: "Analyst, metaphysician and founder of scientific computing.",
  intro:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
  url: "https://varunayyappan.github.io",
  base: "/Nord-Portfolio-Astro-Theme",
  navigation: [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects/" },
    { label: "Blog", href: "/blog/" },
  ],
  // Placeholders that can never belong to a real account: GitHub and
  // LinkedIn don't allow underscores in usernames, X doesn't allow hyphens,
  // and .example domains are reserved (RFC 2606), so no Mastodon server or
  // Bluesky handle can use one.
  social: {
    github: "https://github.com/your_username",
    linkedin: "https://www.linkedin.com/in/your_username",
    mastodon: "https://mastodon.example/@your_username",
    bluesky: "https://bsky.app/profile/your-username.example",
    // x: "https://x.com/your-username",
    email: "ada@example.com",
  },
};
