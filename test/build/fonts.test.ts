import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { outDir, outputFiles, resolveToFile } from "./output";

describe("fonts", () => {
  const sources = outputFiles()
    .filter((file) => /\.(html|css)$/.test(file))
    .map((file) => readFileSync(path.join(outDir, file), "utf8"));
  const fontUrls = sources.flatMap((source) =>
    [...source.matchAll(/@font-face\s*{[^}]*}/g)].flatMap(([rule]) =>
      [...rule.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map(
        ([, url]) => url,
      ),
    ),
  );

  it("declares font faces", () => {
    expect(fontUrls.length).toBeGreaterThan(0);
  });

  it("self-hosts every font file in the build output", () => {
    const external = fontUrls.filter((url) => /^([a-z]+:)?\/\//i.test(url));
    expect(external).toEqual([]);
    const missing = fontUrls.filter((url) => resolveToFile(url) === undefined);
    expect(missing).toEqual([]);
  });

  it("never references third-party font hosts", () => {
    const hosts =
      /fonts\.googleapis\.com|fonts\.gstatic\.com|fontsource\.org|fonts\.bunny\.net/;
    expect(sources.filter((source) => hosts.test(source))).toEqual([]);
  });
});
