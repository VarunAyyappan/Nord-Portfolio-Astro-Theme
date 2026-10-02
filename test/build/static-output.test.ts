import path from "node:path";
import { describe, expect, it } from "vitest";
import { outputFiles } from "./output";

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
});
