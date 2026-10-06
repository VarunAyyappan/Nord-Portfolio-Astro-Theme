import { type Availability, siteConfig } from "../site.config";

/** The fixed label shown for each Availability setting. */
export const availabilityLabels: Record<Availability, string> = {
  open: "Open to new opportunities",
  selective: "Open to select projects",
  "not-looking": "Not looking right now",
};

/** The Availability Site config sets, with its label, if any. */
export const availability = siteConfig.availability && {
  setting: siteConfig.availability,
  label: availabilityLabels[siteConfig.availability],
};
