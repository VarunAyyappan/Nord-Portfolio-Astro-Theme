/** The Color mode settings, in the order the toggle cycles through them. */
export const colorModeSettings = ["system", "dark", "light"] as const;

export type ColorModeSetting = (typeof colorModeSettings)[number];

/**
 * The browser storage key a dark or light setting is saved under. Nothing is
 * saved for system.
 */
export const colorModeStorageKey = "color-mode";

/** The setting after `setting` in the toggle's cycle. */
export function nextColorModeSetting(
  setting: ColorModeSetting,
): ColorModeSetting {
  const index = colorModeSettings.indexOf(setting);
  return colorModeSettings[(index + 1) % colorModeSettings.length];
}
