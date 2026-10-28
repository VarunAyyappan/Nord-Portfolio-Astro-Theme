/**
 * A path on this site, starting with "/", before the base path, e.g.
 * "/blog/" or "/share.png". It is a path, not a file's place in the project:
 * public/share.png is "/share.png".
 */
export type SitePath = `/${string}`;

/**
 * Whether `value` is a SitePath, for a value the type check can't see, such
 * as one read from content.
 */
export function isSitePath(value: string): value is SitePath {
  return value.startsWith("/");
}
