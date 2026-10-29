# Nord Portfolio Astro Theme

A starter template for a software developer's portfolio, built with [Astro](https://astro.build) and styled only with the [Nord](https://www.nordtheme.com) color palette. It builds to plain static files, sends Visitors almost no JavaScript, and meets WCAG AA contrast in both dark and light Color modes.

**[See the live demo](https://varunayyappan.github.io/Nord-Portfolio-Astro-Theme/)**

It ships with filler content written as Ada Lovelace. You replace it by editing one Site config file and a folder of Markdown and YAML files, without touching component code. You own your copy outright: there's no automatic upgrade path, so change anything you like, and [apply a later release's changes](#updating-from-the-theme) with git when you want them.

## Getting started

```sh
npm create astro@latest -- --template VarunAyyappan/Nord-Portfolio-Astro-Theme
```

You need Node 22.12 or later. The theme uses [aube](https://aube.sh) as its package manager, and pins Node 24 and aube for [mise](https://mise.jdx.dev) in `mise.toml`, which is how CI installs them too. aube keeps the lockfile in pnpm's format, `pnpm-lock.yaml`, so GitHub's Dependabot alerts can check every dependency in it, and pnpm can use it as it is.

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

Set `featured: true` on any number of Projects to show them on Home, newest first. A featured draft shows in the dev server only, like any other draft.

A Project or Post's file name is its URL, e.g. `notes-on-note-g.md` is served at `/blog/notes-on-note-g/`. Images go beside the Markdown file and are linked relatively, e.g. `./covers/my-project.png`, so they're optimized at build time. Posts and Projects are plain Markdown, not MDX, and code blocks are highlighted in Nord colors with no setup.

In Site config, `resume` is optional: leave it out and Experience shows no download link. `shareImage` is the image link previews show, 1200 × 630 pixels. A Post or Project can set its own share image with `cover` in its frontmatter, cropped to that size. A Post without a cover gets a share image generated at build time instead: its title and your `name` in Schibsted Grotesk on a Nord background, so link previews of different Posts look different. Your favicon, `public/favicon.svg`, sits at the bottom right, in line with your `name`, trimmed to what shows on the dark background: the Theme's favicon is a mark on a square of that same color, so only the mark shows. A favicon drawn dark on a transparent background barely shows there, and without a `favicon.svg` the share images have no logo. The cover also leads the text at the top of the Post's or Project's page, uncropped there, and shows on a Project's tile, cropped to the same 1200 × 630 proportions. `availability` is optional too: leave it out and neither Contact nor Home shows it.

`resume`, `shareImage` and each `navigation` `href` are paths on your site, starting with "/", and the base path is added for you. A file in `public/` is served from the site's root, e.g. `public/share.png` is `/share.png`. `resume` can also be a full `https://` URL, such as a Drive link, which is used as given. Links to other sites go in `social`, not `navigation`. A value that breaks these rules fails the type check, both in your editor and in Deploy.

The filler PGP fingerprint on Contact is a placeholder. Replace it with your own, or remove it. To offer your public key for download, put it in `public/` and set `pgpKey` to its path, e.g. `/pgp-key.asc`.

### Drafts

Set `draft: true` on a Post or Project to work on it privately. Drafts show in the dev server and are left out of every build: their pages, lists, Tag pages, the RSS feed and the sitemap.

### Replacing the filler content

1. Fill in `src/site.config.ts`.
2. Replace the files in each `src/content/` folder, including the filler images.
3. Replace the files in `public/`, or remove `resume` from Site config. Give your `favicon.svg` a `<title>`, since lint requires one and Deploy runs lint.
4. Rewrite this README for your own portfolio.
5. Delete `AGENTS.md`, `CLAUDE.md`, `GLOSSARY.md`, `docs/agents/` and `docs/adr/`. They set up coding agents for developing the theme itself and record its design decisions, so replace them with your own if you use an agent to help fill in your site.

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

`.github/workflows/deploy.yml` deploys the site on every push to `main`. To turn it on, set **Settings → Pages → Source** to **GitHub Actions** in your repo. Before it builds, Deploy type checks the site and content (`aube run check`) and lints with Biome (`aube run lint`), and it doesn't deploy if either fails. Neither depends on the filler content, so your pushes deploy without your editing any tests.

`.github/workflows/ci.yml` runs Biome's lint and format checks, the type check, both test suites and a build. It runs only on pull requests, or when you start it on any branch from the **Actions** tab, so if you push straight to `main`, the test suites don't run on your changes.

For a custom domain, enter it under **Settings → Pages → Custom domain**, follow GitHub's instructions for your DNS records, then turn on **Enforce HTTPS**. You don't need a `CNAME` file, since the site deploys from a workflow.

### Other static hosts

On Netlify, Vercel, Cloudflare Pages and similar hosts, use `npm run build` (or your package manager's equivalent) as the build command, `dist` as the output directory, and Node 22.12 or later. These hosts don't install aube, so switch to pnpm, which uses the lockfile as it is, or to another package manager first.

## Using a different package manager

CI installs with `aube ci`, which fails if `pnpm-lock.yaml` doesn't match `package.json`. To use npm, pnpm, Yarn or Bun instead, change three places:

1. **The lockfile:** with pnpm, keep `pnpm-lock.yaml` as it is, since [aube reads and writes it in place](https://aube.sh/pnpm-users). For npm, Yarn or Bun, delete it, install with your package manager, and commit the lockfile it writes.
2. **The mise config:** remove the `aube` line from `mise.toml`. npm comes with Node; for another package manager, add it in its place (e.g. `pnpm = "10"`).
3. **The CI install step:** in `.github/workflows/ci.yml` and `deploy.yml`, replace `aube ci`, and also every other `aube` command:

| aube | npm | pnpm | Yarn | Bun |
| --- | --- | --- | --- | --- |
| `aube ci` | `npm ci` | `pnpm install --frozen-lockfile` | `yarn install --immutable` | `bun install --frozen-lockfile` |
| `aube run <script>` | `npm run <script>` | `pnpm run <script>` | `yarn run <script>` | `bun run <script>` |
| `aube exec <binary>` | `npx <binary>` | `pnpm exec <binary>` | `yarn exec <binary>` | `bunx <binary>` |

## Customizing

### Colors

The Nord colors and the color roles built from them (background, surface, text, muted text, accent, border, and plate, the fill a Project without a cover shows its title on) are defined once at the top of [`src/styles/global.css`](src/styles/global.css). Components only use the roles, so you change the look there. Each role is `light-dark(<light mode>, <dark mode>)`, and the Visitor's Color mode setting picks which half applies.

The roles follow pairing rules that keep all text at WCAG AA contrast:

- **Dark mode:** Polar Night (nord0–nord3) backgrounds, Snow Storm (nord4–nord6) text, and Frost (nord7–nord10) and Aurora (nord11–nord15) accents.
- **Light mode:** Snow Storm backgrounds and Polar Night text. Frost and Aurora are only used for non-text elements, because every one of them falls below AA contrast on nord6. That's why links are text-colored with an accent underline.
- **nord3 is never used for text,** because it's only 1.7:1 on nord0.

The browser tests scan every page for contrast in both Color modes, so `aube run test:e2e` catches a change that breaks these rules. Code blocks stay dark in both Color modes (see `src/shiki/nord-theme.ts`).

The share images generated for Posts without a cover don't read `global.css`: they use their own copies of the dark Color mode's background, text and accent colors, at the top of `src/share-image/render.ts`. If you change those roles, change the copies there too.

### Fonts

The `fonts` list in `astro.config.ts` sets Schibsted Grotesk for text and headings and JetBrains Mono for code. They're downloaded from [Fontsource](https://fontsource.org) at build time and served from your own site. To swap one, change its `name` to any Fontsource family and adjust `weights` and `styles`. Keep `cssVariable` as it is.

The share images generated for Posts without a cover use their own copy of Schibsted Grotesk, `src/share-image/SchibstedGrotesk-Variable.ttf`, with the fontconfig settings in `src/share-image/fonts.conf`, so they look the same on any machine that builds the site. To set them in another typeface, put its font file in `src/share-image/` and change the file and family names in `src/share-image/render.ts`.

### Icons

Icons are plain inline SVG components in `src/components/icons/`. To add one, copy an existing icon, such as `GitHub.astro`, and paste in your SVG's `viewBox` and paths. Keep `width="1em"`, `height="1em"` and `fill="currentColor"` so it sizes and colors itself like the surrounding text. A link holding only an icon needs an `aria-label`.

## Updating from the Theme

`create astro` copies the Theme's files without their history, so `git merge` can't bring a later release into your copy. Instead, you apply the changes between the release you scaffolded from and the new one. The `version` in your `package.json` says which release you started from.

Each release's [notes](https://github.com/VarunAyyappan/Nord-Portfolio-Astro-Theme/releases) list what changed and what you must do by hand, so read them first. For a release that rewrites most of the styles, as v2.0.0 does, scaffolding it fresh and copying your content, Site config and `public/` files across can be easier, especially if you've restyled your copy.

The steps below update from v1.0.0 to v2.0.0, so change both versions to yours.

1. **Fetch the Theme's releases.** Add the Theme as a remote that fetches only its release tags, under a `theme/` prefix, so its `theme/v2.0.0` can't clash with a `v2.0.0` tag of your own:

   ```sh
   git remote add --no-tags theme https://github.com/VarunAyyappan/Nord-Portfolio-Astro-Theme.git
   git config remote.theme.fetch 'refs/tags/v*:refs/tags/theme/v*'
   git fetch theme
   ```

   Next time, `git fetch theme` alone gets the new release.

2. **Apply the changes.** Commit your work first, since `git apply --3way` needs a clean working tree, then apply the changes on a new branch:

   ```sh
   git switch -c theme-v2.0.0
   git diff --binary theme/v1.0.0 theme/v2.0.0 -- . \
     ':!src/content' ':!public' \
     ':!aube-lock.yaml' ':!pnpm-lock.yaml' \
     ':!README.md' ':!AGENTS.md' ':!CLAUDE.md' ':!CONTEXT.md' ':!GLOSSARY.md' ':!docs' \
     | git apply --3way
   ```

   The diff leaves out your content and `public/` files, so the filler content never comes back. It also leaves out the lockfile (see step 4) and the files you [rewrite or delete](#replacing-the-filler-content) when you replace the filler content. The fetch gave git the Theme's files, so `--3way` merges each change into your version of the file, and a conflict appears only where you changed the same lines of the Theme's code.

   `src/site.config.ts` is in the diff, because it holds the Site config's types and doc comments as well as your values. A release changes the types and comments and you change the values, so they usually merge without a conflict. If one appears, keep your values and the release's types and comments.

   If git says a file "does not exist in index", you deleted it, often along with the rest of the test suites. Nothing was applied, so add it to the list, e.g. `':!test'`, and run the `git diff … | git apply --3way` command again, without `git switch -c`, since you're already on the branch.

3. **Resolve the conflicts.** `git status` lists them, and you resolve them as in any merge. To keep your own version of a file you replaced, run `git checkout --ours -- <file>`. Then `git add` each file you resolved.

   `package.json` always conflicts next to its `version`, since `create astro` removed the line after it, `"private": true`, when you scaffolded. Take the release's `version`, so it records the release you're now on, and keep your own dependencies alongside the release's.

4. **Update the lockfile.** With aube or pnpm, take the new release's lockfile and install, which adds any dependencies of your own:

   ```sh
   git rm -q --ignore-unmatch aube-lock.yaml
   git checkout theme/v2.0.0 -- pnpm-lock.yaml
   aube install
   ```

   v1.0.0's lockfile is `aube-lock.yaml`, and later releases' is `pnpm-lock.yaml`, so the first command removes v1.0.0's. With another package manager, run its install. If the type check then fails on two versions of one package, delete your lockfile and install again.

5. **Check it.** Run `aube run check`, `aube run lint` and `aube run build`. If the release made a Site config field stricter, the type check names the value of yours it now rejects, and the release notes say what to set. Then commit, and merge the branch.

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
| `aube run test:e2e` | Builds the site and runs the browser tests (Playwright), including an accessibility scan. Run `aube exec playwright install chromium` once first. It serves the site on a free port, so a running dev server doesn't get in the way; set `E2E_PORT` to choose one. |
