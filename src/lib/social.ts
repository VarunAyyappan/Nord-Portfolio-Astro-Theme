import BlueskyIcon from "../components/icons/Bluesky.astro";
import EmailIcon from "../components/icons/Email.astro";
import GitHubIcon from "../components/icons/GitHub.astro";
import LinkedInIcon from "../components/icons/LinkedIn.astro";
import MastodonIcon from "../components/icons/Mastodon.astro";
import XIcon from "../components/icons/X.astro";
import { siteConfig } from "../site.config";

const { github, linkedin, mastodon, bluesky, x, email } = siteConfig.social;

/** The social network links Site config sets, in display order. */
export const networkLinks = [
  { label: "GitHub", link: github, Icon: GitHubIcon },
  { label: "LinkedIn", link: linkedin, Icon: LinkedInIcon },
  { label: "Mastodon", link: mastodon, Icon: MastodonIcon },
  { label: "Bluesky", link: bluesky, Icon: BlueskyIcon },
  { label: "X", link: x, Icon: XIcon },
].flatMap(({ link, ...network }) =>
  link ? [{ ...network, href: link.url, handle: link.handle }] : [],
);

/**
 * The email link Site config sets, if any. The subject is URL-encoded into
 * the mailto: link.
 */
export const emailLink = email
  ? {
      label: "Email",
      href: email.subject
        ? `mailto:${email.address}?subject=${encodeURIComponent(email.subject)}`
        : `mailto:${email.address}`,
      Icon: EmailIcon,
      address: email.address,
    }
  : undefined;

/** Every social link Site config sets, email last. */
export const socialLinks = emailLink
  ? [...networkLinks, emailLink]
  : networkLinks;
