/** The widths every page template is checked at. */
export const viewports = [
  { name: "phone", width: 375, height: 667 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

/** The two rendered color modes, as emulated `prefers-color-scheme` values. */
export const colorModes = ["dark", "light"] as const;

/** Polar Night nord0 and Snow Storm nord6, the page backgrounds, as computed CSS colors. */
export const backgrounds = {
  dark: "rgb(46, 52, 64)",
  light: "rgb(236, 239, 244)",
} as const;
