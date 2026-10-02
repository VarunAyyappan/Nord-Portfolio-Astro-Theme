import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { parse } from "node-html-parser";
import { siteConfig } from "../../src/site.config";

/** The production build output directory. */
export const outDir = path.resolve("dist");

/** The base path with a trailing slash, e.g. "/Nord-Portfolio-Astro-Theme/". */
export const basePath = `${siteConfig.base.replace(/\/$/, "")}/`;

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

/** Parses a built HTML file, given its path relative to `outDir`. */
export function readPage(file: string) {
  return parse(readFileSync(path.join(outDir, file), "utf8"));
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
