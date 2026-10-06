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
  { label: "GitHub", href: github, Icon: GitHubIcon },
  { label: "LinkedIn", href: linkedin, Icon: LinkedInIcon },
  { label: "Mastodon", href: mastodon, Icon: MastodonIcon },
  { label: "Bluesky", href: bluesky, Icon: BlueskyIcon },
  { label: "X", href: x, Icon: XIcon },
].filter((link): link is typeof link & { href: string } => Boolean(link.href));

/** The email link Site config sets, if any. */
export const emailLink = email
  ? { label: "Email", href: `mailto:${email}`, Icon: EmailIcon, email }
  : undefined;

/** Every social link Site config sets, email last. */
export const socialLinks = emailLink
  ? [...networkLinks, emailLink]
  : networkLinks;
