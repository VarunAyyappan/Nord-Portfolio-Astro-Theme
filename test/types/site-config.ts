/**
 * Site config values the type check must reject. Nothing runs this file:
 * `astro check` does, in CI and in Deploy. Each `@ts-expect-error` fails the
 * check if the value below it stops being an error.
 */
import type { NavLink, SiteConfig } from "../../src/site.config";

/** A résumé hosted on another site, such as a Drive link. */
export const resumeUrl: Partial<SiteConfig> = {
  resume: "https://drive.example/ada-lovelace-resume.pdf",
};

export const resumeInPublic: Partial<SiteConfig> = {
  // @ts-expect-error A file in public/ is served at "/resume.pdf".
  resume: "public/resume.pdf",
};

export const shareImageInPublic: Partial<SiteConfig> = {
  // @ts-expect-error A file in public/ is served at "/share.png".
  shareImage: "public/share.png",
};

export const shareImageUrl: Partial<SiteConfig> = {
  // @ts-expect-error The share image must be on this site.
  shareImage: "https://images.example/share.png",
};

export const navigationInPublic: NavLink = {
  label: "Uses",
  // @ts-expect-error A file in public/ is served at "/uses.html".
  href: "public/uses.html",
};

export const navigationUrl: NavLink = {
  label: "Blog",
  // @ts-expect-error Links to other sites go in the social links.
  href: "https://blog.example",
};
