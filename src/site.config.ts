import { sectionPaths } from "./lib/sections";

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
  /**
   * Whether the Adopter is looking for work, shown on Contact and under the
   * tagline on Home as a fixed label with a colored dot:
   *   - "open": Open to new opportunities (green)
   *   - "selective": Open to select projects (yellow)
   *   - "not-looking": Not looking right now (red)
   * Leave it out and neither shows it.
   */
  availability?: Availability;
  /**
   * The Adopter's résumé PDF, as a path on this site starting with "/". Put
   * the file in public/, e.g. public/resume.pdf is "/resume.pdf". The base
   * path is added for you. Leave it out and the Experience Section shows no
   * download link.
   */
  resume?: string;
  /**
   * The image link previews show when a page is shared, as a path on this
   * site starting with "/". Put the file in public/, e.g. public/share.png is
   * "/share.png". The base path is added for you. Make it 1200 × 630 pixels,
   * as a PNG or JPEG. A Post or Project with a cover uses its cover instead.
   */
  shareImage: string;
  /**
   * The Adopter's Skills, shown on Home in groups, in this order. Leave the
   * list empty and Home shows no Skills.
   */
  skills: SkillGroup[];
}

/** Whether the Adopter is looking for work. See `SiteConfig.availability`. */
export type Availability = "open" | "selective" | "not-looking";

/** Skills listed together on Home under one heading. */
export interface SkillGroup {
  /** E.g. "Languages" or "Tools". */
  heading: string;
  skills: string[];
}

/** A link in the header navigation. */
export interface NavLink {
  /** The text shown for the link. */
  label: string;
  /**
   * A path on this site, starting with "/", e.g. `sectionPaths.blog` or
   * "/uses/". The base path is added for you.
   */
  href: string;
}

/**
 * Links to the Adopter elsewhere, shown as icons in the footer and listed on
 * the Contact Section. Leave one out and it disappears from both.
 */
export interface SocialLinks {
  github?: SocialLink;
  linkedin?: SocialLink;
  mastodon?: SocialLink;
  bluesky?: SocialLink;
  x?: SocialLink;
  email?: EmailLink;
}

/** A profile on a social network. */
export interface SocialLink {
  /** The profile URL. */
  url: string;
  /**
   * The Adopter's name on the network, e.g. "@your_username", shown next to
   * the network's name on Contact. The footer shows icons only.
   */
  handle?: string;
}

/** An email address, linked with mailto: on Contact and in the footer. */
export interface EmailLink {
  address: string;
  /** A subject the Visitor's email app fills in, e.g. "Hello". */
  subject?: string;
}

export const siteConfig: SiteConfig = {
  name: "Ada Lovelace",
  tagline: "Analyst, metaphysician and founder of scientific computing.",
  intro:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
  url: "https://varunayyappan.github.io",
  base: "/Nord-Portfolio-Astro-Theme",
  // Each Section's path is in src/lib/sections.ts, e.g. sectionPaths.blog is
  // "/blog/". To link to a page of your own, type its path, e.g. "/uses/".
  navigation: [
    { label: "Home", href: sectionPaths.home },
    { label: "Projects", href: sectionPaths.projects },
    { label: "Blog", href: sectionPaths.blog },
    { label: "Experience", href: sectionPaths.experience },
    { label: "About", href: sectionPaths.about },
    { label: "Contact", href: sectionPaths.contact },
  ],
  // Placeholders that can never belong to a real account: GitHub and
  // LinkedIn don't allow underscores in usernames, X doesn't allow hyphens,
  // and .example domains are reserved (RFC 2606), so no Mastodon server or
  // Bluesky handle can use one.
  social: {
    github: {
      url: "https://github.com/your_username",
      handle: "@your_username",
    },
    linkedin: {
      url: "https://www.linkedin.com/in/your_username",
      handle: "your_username",
    },
    mastodon: {
      url: "https://mastodon.example/@your_username",
      handle: "@your_username@mastodon.example",
    },
    bluesky: {
      url: "https://bsky.app/profile/your-username.example",
      handle: "@your-username.example",
    },
    // x: { url: "https://x.com/your-username", handle: "@your-username" },
    email: { address: "ada@example.com", subject: "Hello from your portfolio" },
  },
  availability: "open",
  resume: "/resume.pdf",
  shareImage: "/share.png",
  skills: [
    {
      heading: "Languages",
      skills: ["English", "French", "Italian", "Note G"],
    },
    {
      heading: "Mathematics",
      skills: ["Bernoulli numbers", "Calculus", "Probability"],
    },
    {
      heading: "Machines",
      skills: ["Analytical Engine", "Difference Engine", "Jacquard loom"],
    },
  ],
};
