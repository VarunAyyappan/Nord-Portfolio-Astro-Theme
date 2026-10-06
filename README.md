# Nord Portfolio Astro Theme

A starter template for a software developer's portfolio, built with [Astro](https://astro.build) and styled only with the [Nord](https://www.nordtheme.com) color palette. It builds to plain static files, sends Visitors almost no JavaScript, and meets WCAG AA contrast in both dark and light Color modes.

**[See the live demo](https://varunayyappan.github.io/Nord-Portfolio-Astro-Theme/)**

It ships with filler content written as Ada Lovelace. You replace it by editing one Site config file and a folder of Markdown and YAML files, without touching component code. You own your copy outright: there is no upgrade path, so change anything you like.

## Getting started

```sh
npm create astro@latest -- --template VarunAyyappan/Nord-Portfolio-Astro-Theme
```

You need Node 22.12 or later. The theme uses [aube](https://github.com/jdx/aube) as its package manager, and pins Node 24 and aube for [mise](https://mise.jdx.dev) in `mise.toml`, which is how CI installs them too.

**With mise and aube**, scaffold with `--no-install` instead, since `create astro` installs with npm even when run through aube, which writes an npm lockfile:

```sh
aube create astro@latest --template VarunAyyappan/Nord-Portfolio-Astro-Theme --no-install
cd your-portfolio
mise install
aube install
aube run dev
```

**Without mise**, [switch to another package manager](#using-a-different-package-manager) before you push, or CI fails on its aube install step.

## Content

| Content | Where it lives |
| --- | --- |
| Projects | `src/content/projects/*.md` |
| Posts | `src/content/posts/*.md` |
| Experience entries | `src/content/experience/*.yaml` |
| Education entries | `src/content/education/*.yaml` |
| About | `src/content/about/about.md` |
| Contact intro, "Open to" list, response time, timezone and PGP key | `src/content/contact/contact.md` |
| Name, tagline, intro, Availability, Skills, social links and navigation | `src/site.config.ts` |
| Résumé, share image and favicon | `public/resume.pdf`, `public/share.png`, `public/favicon.svg` |

Every field is documented where it's defined: content fields in [`src/content.config.ts`](src/content.config.ts) and Site config fields in [`src/site.config.ts`](src/site.config.ts). Each field shows whether it's optional and its default, with a comment on any field whose name doesn't explain itself. A field that doesn't match fails the build with an error naming the file, so the easiest way to add an entry is to copy a filler file and edit it.

Set `featured: true` on up to three Projects to show them on Home, newest first. Featuring more fails the build with an error naming them, and drafts don't count. In the dev server, featured drafts fill only the room the published ones leave.

A Project or Post's file name is its URL, e.g. `notes-on-note-g.md` is served at `/blog/notes-on-note-g/`. Images go beside the Markdown file and are linked relatively, e.g. `./covers/my-project.png`, so they're optimized at build time. Posts and Projects are plain Markdown, not MDX, and code blocks are highlighted in Nord colors with no setup.

In Site config, `resume` is optional: leave it out and Experience shows no download link. `shareImage` is the image link previews show, 1200 × 630 pixels. A Post or Project can set its own share image with `cover` in its frontmatter, cropped to that size. A Project's cover also shows on its page, but for now a Post's cover shows only in link previews. `availability` is optional too: leave it out and neither Contact nor Home shows it.

The filler PGP fingerprint on Contact is a placeholder. Replace it with your own, or remove it. To offer your public key for download, put it in `public/` and set `pgpKey` to its path, e.g. `/pgp-key.asc`.

### Drafts

Set `draft: true` on a Post or Project to work on it privately. Drafts show in the dev server and are left out of every build: their pages, lists, Tag pages, the RSS feed and the sitemap.

### Replacing the filler content

1. Fill in `src/site.config.ts`.
2. Replace the files in each `src/content/` folder, including the filler images.
3. Replace the files in `public/`, or remove `resume` from Site config.
4. Rewrite this README for your own portfolio.
5. Delete `AGENTS.md`, `CLAUDE.md` and `docs/agents/`. They set up coding agents for developing the theme itself, so replace them with your own if you use an agent to help fill in your site.

The test suites use the filler content as their fixture, and some tests check for things your content may not have, such as a draft Post and Project, more Posts than fit on one Blog page, or a Post and Project with a cover. Update or delete those tests as your content replaces the filler.

## Deploying

The build is plain static files in `dist/`, so it can go on any static host. Set `url` and `base` in Site config to match where it's served. A wrong `base` breaks every link, style and image.

| Where you deploy | `url` | `base` |
| --- | --- | --- |
| GitHub Pages user site (a repo named `<user>.github.io`) | `"https://your_username.github.io"` | `"/"` |
| GitHub Pages project site (any other repo name, e.g. `portfolio`) | `"https://your_username.github.io"` | `"/portfolio"` |
| Custom domain | `"https://www.example.com"` | `"/"` |
| Another static host | The address it gives you, e.g. `"https://portfolio.netlify.app"` | `"/"` |

The theme ships with the demo's project site settings, so change both before you deploy.

### GitHub Pages

`.github/workflows/deploy.yml` deploys the site on every push to `main`. To turn it on, set **Settings → Pages → Source** to **GitHub Actions** in your repo. `.github/workflows/ci.yml` checks every pull request with Biome, type checking, both test suites and a build. You can also run it on any branch from the **Actions** tab.

For a custom domain, enter it under **Settings → Pages → Custom domain**, follow GitHub's instructions for your DNS records, then turn on **Enforce HTTPS**. You don't need a `CNAME` file, since the site deploys from a workflow.

### Other static hosts

On Netlify, Vercel, Cloudflare Pages and similar hosts, use `npm run build` (or your package manager's equivalent) as the build command, `dist` as the output directory, and Node 22.12 or later. These hosts don't install aube, so switch package managers first.

## Using a different package manager

CI installs with `aube ci`, which fails if `aube-lock.yaml` doesn't match `package.json`. To use npm, pnpm, Yarn or Bun instead, change three places:

1. **The lockfile:** delete `aube-lock.yaml`, install with your package manager, and commit the lockfile it writes.
2. **The mise config:** remove the `aube` line from `mise.toml`. npm comes with Node; for another package manager, add it in its place (e.g. `pnpm = "10"`).
3. **The CI install step:** in `.github/workflows/ci.yml` and `deploy.yml`, replace `aube ci`, and also every other `aube` command:

| aube | npm | pnpm | Yarn | Bun |
| --- | --- | --- | --- | --- |
| `aube ci` | `npm ci` | `pnpm install --frozen-lockfile` | `yarn install --immutable` | `bun install --frozen-lockfile` |
| `aube run <script>` | `npm run <script>` | `pnpm run <script>` | `yarn run <script>` | `bun run <script>` |
| `aube exec <binary>` | `npx <binary>` | `pnpm exec <binary>` | `yarn exec <binary>` | `bunx <binary>` |

## Customizing

### Colors

The Nord colors and the color roles built from them (background, surface, text, muted text, accent and border) are defined once at the top of [`src/styles/global.css`](src/styles/global.css). Components only use the roles, so you change the look there. Each role is `light-dark(<light mode>, <dark mode>)`, and the Visitor's Color mode setting picks which half applies.

The roles follow pairing rules that keep all text at WCAG AA contrast:

- **Dark mode:** Polar Night (nord0–nord3) backgrounds, Snow Storm (nord4–nord6) text, and Frost (nord7–nord10) and Aurora (nord11–nord15) accents.
- **Light mode:** Snow Storm backgrounds and Polar Night text. Frost and Aurora are only used for non-text elements, because every one of them falls below AA contrast on nord6. That's why links are text-colored with an accent underline.
- **nord3 is never used for text,** because it's only 1.7:1 on nord0.

The browser tests scan every page for contrast in both Color modes, so `aube run test:e2e` catches a change that breaks these rules. Code blocks stay dark in both Color modes (see `src/shiki/nord-theme.ts`).

### Fonts

The `fonts` list in `astro.config.ts` sets Inter for text and JetBrains Mono for code. They're downloaded from [Fontsource](https://fontsource.org) at build time and served from your own site. To swap one, change its `name` to any Fontsource family and adjust `weights` and `styles`. Keep `cssVariable` as it is.

### Icons

Icons are plain inline SVG components in `src/components/icons/`. To add one, copy an existing icon, such as `GitHub.astro`, and paste in your SVG's `viewBox` and paths. Keep `width="1em"`, `height="1em"` and `fill="currentColor"` so it sizes and colors itself like the surrounding text. A link holding only an icon needs an `aria-label`.

## Commands

With another package manager, use its equivalent, e.g. `npm run dev`.

| Command | What it does |
| --- | --- |
| `aube run dev` | Starts the dev server, with drafts. |
| `aube run build` | Builds the site to `dist/`. |
| `aube run preview` | Serves the build locally. |
| `aube run check` | Type checks the site and content. |
| `aube run lint` / `aube run format` | Lints / formats with Biome. `aube exec biome ci` checks both, as CI does. |
| `aube run test` | Builds the site and runs the build-output tests (Vitest). |
| `aube run test:e2e` | Builds the site and runs the browser tests (Playwright), including an accessibility scan. Run `aube exec playwright install chromium` once first. |
