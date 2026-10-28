import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { outDir, outputFiles, resolveToFile } from "./output";

describe("fonts", () => {
  const sources = outputFiles()
    .filter((file) => /\.(html|css)$/.test(file))
    .map((file) => readFileSync(path.join(outDir, file), "utf8"));
  const faces = sources.flatMap((source) =>
    [...source.matchAll(/@font-face\s*{[^}]*}/g)].map(([rule]) => rule),
  );
  const fontUrls = faces.flatMap((rule) =>
    [...rule.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map(
      ([, url]) => url,
    ),
  );
  /**
   * The families of the faces that load a font file, by their Fontsource
   * names. Astro names each family with a hash after it, as in
   * "Inter-46611d298277ca1c", and its metric-matched fallbacks, which load a
   * local font instead, with a " fallback: Arial" after that.
   */
  const families = new Set(
    faces
      .filter((rule) => /url\(/.test(rule))
      .map((rule) =>
        (rule.match(/font-family:\s*["']?([^;"']+)/)?.[1] ?? "").replace(
          /-[0-9a-f]+$/,
          "",
        ),
      ),
  );

  it("declares font faces", () => {
    expect(fontUrls.length).toBeGreaterThan(0);
  });

  it("are Schibsted Grotesk for text and JetBrains Mono for code, and nothing else", () => {
    expect([...families].toSorted()).toEqual([
      "JetBrains Mono",
      "Schibsted Grotesk",
    ]);
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
