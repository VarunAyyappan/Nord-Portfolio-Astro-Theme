import path from "node:path";
import { describe, expect, it } from "vitest";
import { outputFiles, readOutput } from "./output";

describe("static output", () => {
  const files = outputFiles();

  it("builds Home as a static HTML file", () => {
    expect(files).toContain("index.html");
  });

  it("contains no server entry points", () => {
    expect(files.filter((file) => /\.(mjs|cjs)$/.test(file))).toEqual([]);
    expect(files.some((file) => file.startsWith(`server${path.sep}`))).toBe(
      false,
    );
  });

  it("ships no client router, so page transitions are CSS only", () => {
    // Astro's client router marks each page with this meta tag and looks for
    // it from its script, so the name appears in either.
    const routerFiles = files.filter(
      (file) =>
        /\.(html|js)$/.test(file) &&
        readOutput(file).includes("astro-view-transitions"),
    );
    expect(routerFiles).toEqual([]);
  });
});
