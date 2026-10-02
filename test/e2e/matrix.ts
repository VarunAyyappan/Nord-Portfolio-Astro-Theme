/** The widths every page template is checked at. */
export const viewports = [
  { name: "phone", width: 375, height: 667 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

/** The two rendered color modes, as emulated `prefers-color-scheme` values. */
export const colorModes = ["dark", "light"] as const;
