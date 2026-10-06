import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { type HTMLElement, parse } from "node-html-parser";
import { siteConfig } from "../../src/site.config";

/** The production build output directory. */
export const outDir = path.resolve("dist");

/** The base path with a trailing slash, e.g. "/Nord-Portfolio-Astro-Theme/". */
export const basePath = `${siteConfig.base.replace(/\/$/, "")}/`;

/** The deployed site's origin, e.g. "https://varunayyappan.github.io". */
export const siteOrigin = new URL(siteConfig.url).origin;

const { email, ...networks } = siteConfig.social;

/**
 * The mailto: link to the email address Site config sets, with its subject
 * URL-encoded, if there is an address.
 */
export const mailtoHref =
  email &&
  `mailto:${email.address}${email.subject ? `?subject=${encodeURIComponent(email.subject)}` : ""}`;

/** The hrefs of the social links Site config sets, and only those. */
export const socialHrefs = [
  ...Object.values(networks).map((link) => link?.url),
  mailtoHref,
].filter((href): href is string => Boolean(href));

/** The URL path of a site path such as "/projects/", under the base path. */
export function sitePath(path: string): string {
  return `${basePath}${path.replace(/^\//, "")}`;
}

/** Every file in the build output, as paths relative to `outDir`. */
export function outputFiles(dir = outDir): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory()
      ? outputFiles(full)
      : [path.relative(outDir, full)];
  });
}

/** Every HTML file in the build output, as paths relative to `outDir`. */
export function htmlFiles(): string[] {
  return outputFiles().filter((file) => file.endsWith(".html"));
}

/** Reads a built text file, given its path relative to `outDir`. */
export function readOutput(file: string): string {
  return readFileSync(path.join(outDir, file), "utf8");
}

/** Parses a built HTML file, given its path relative to `outDir`. */
export function readPage(file: string) {
  return parse(readOutput(file));
}

/** The URL path a built HTML file is served at under the base path. */
export function pageUrl(file: string): string {
  const route = file.replace(/(^|\/)index\.html$/, "$1");
  return `${basePath}${route}`;
}

/**
 * Maps a URL path under the base path to the output file a static host would
 * serve for it, or `undefined` if there is none.
 */
export function resolveToFile(urlPath: string): string | undefined {
  if (!urlPath.startsWith(basePath) && urlPath !== siteConfig.base) {
    return undefined;
  }
  const route = decodeURIComponent(urlPath.slice(basePath.length));
  const candidates =
    route.endsWith("/") || route === ""
      ? [`${route}index.html`]
      : [route, `${route}/index.html`, `${route}.html`];
  return candidates.find((candidate) => {
    const full = path.join(outDir, candidate);
    return existsSync(full) && statSync(full).isFile();
  });
}

/**
 * The main heading of the page a static host would serve for a URL path
 * under the base path, or `undefined` if there is no such page.
 */
export function headingAt(urlPath: string): string | undefined {
  const file = resolveToFile(urlPath);
  return file && readPage(file).querySelector("main h1")?.textContent.trim();
}

/** The `<section>` of a page whose `<h2>` heading is `heading`. */
export function sectionTitled(page: HTMLElement, heading: string) {
  return page
    .querySelectorAll("main h2")
    .find((h2) => h2.textContent.trim() === heading)
    ?.closest("section");
}

/** Every image URL the given `<img>` elements can load, from `src` and `srcset`. */
export function imageUrls(images: HTMLElement[]): string[] {
  return images.flatMap((image) => [
    image.getAttribute("src") ?? "",
    ...(image
      .getAttribute("srcset")
      ?.split(",")
      .map((candidate) => candidate.trim().split(/\s+/)[0]) ?? []),
  ]);
}

/**
 * The output files that are byte-for-byte copies of any of the given source
 * files, as paths relative to `outDir`.
 */
export function unchangedCopies(sources: string[]): string[] {
  const originals = sources.map((source) => readFileSync(source));
  return outputFiles().filter((file) => {
    const output = readFileSync(path.join(outDir, file));
    return originals.some((original) => original.equals(output));
  });
}
