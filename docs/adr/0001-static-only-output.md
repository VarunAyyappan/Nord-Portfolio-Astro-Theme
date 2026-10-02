# Static-only output

The theme must build to plain static files that deploy unchanged to static-only hosts like GitHub Pages. That rules out SSR adapters, server endpoints at request time, and any feature that needs a backend, such as contact forms, server-side search or on-demand rendering. Features that would normally need a server are either built at compile time (RSS, sitemap, tag pages) or left out.
