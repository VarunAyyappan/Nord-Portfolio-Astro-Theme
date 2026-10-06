import sitemap from "@astrojs/sitemap";
import { defineConfig, fontProviders } from "astro/config";
import { nordTheme } from "./src/shiki/nord-theme";
import { siteConfig } from "./src/site.config";

// Static output only, with no adapter (see docs/adr/0001-static-only-output.md).
export default defineConfig({
  site: siteConfig.url,
  base: siteConfig.base,
  // Lists every built page but the 404 page in sitemap-index.xml, which
  // robots.txt points at (src/pages/robots.txt.ts).
  integrations: [sitemap()],
  markdown: {
    // Code blocks stay dark in both Color modes (see src/shiki/nord-theme.ts).
    shikiConfig: { theme: nordTheme },
  },
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
