import { defineConfig, fontProviders } from "astro/config";
import { siteConfig } from "./src/site.config";

// Static output only, with no adapter (see docs/adr/0001-static-only-output.md).
export default defineConfig({
  site: siteConfig.url,
  base: siteConfig.base,
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Inter",
      cssVariable: "--font-sans",
      weights: ["100 900"],
      styles: ["normal", "italic"],
      subsets: ["latin"],
      fallbacks: ["sans-serif"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "JetBrains Mono",
      cssVariable: "--font-mono",
      weights: ["100 800"],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["monospace"],
    },
  ],
});
