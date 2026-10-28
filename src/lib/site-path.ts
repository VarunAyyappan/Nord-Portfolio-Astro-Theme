/**
 * A path on this site, starting with "/", before the base path, e.g.
 * "/blog/" or "/share.png". It is a path, not a file's place in the project:
 * public/share.png is "/share.png".
 *
 * A second "/" can't follow the first: "//cdn.example/share.png" is a link
 * to another site. Nor can a character outside ASCII, which must be
 * percent-encoded, e.g. "/%C3%BCber/" for "/über/".
 */
export type SitePath = "/" | `/${PathStart}${string}`;

/**
 * What can follow a site path's leading "/": a character that can start a
 * URL path segment, or "?" or "#". Not "/" or "\", which browsers both read
 * as the start of another site's address.
 */
const pathStarts =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~%!$&'()*+,;=:@?#";

type PathStart = CharactersOf<typeof pathStarts>;

/** The characters of a string literal type, as a union. */
type CharactersOf<
  Text extends string,
  Found extends string = never,
> = Text extends `${infer First}${infer Rest}`
  ? CharactersOf<Rest, Found | First>
  : Found;

/**
 * Whether `value` is a SitePath, for a value the type check can't see, such
 * as one read from content.
 */
export function isSitePath(value: string): value is SitePath {
  return (
    value === "/" ||
    (value.startsWith("/") && value.length > 1 && pathStarts.includes(value[1]))
  );
}
