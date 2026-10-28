# Deploy runs only checks that don't depend on the Filler content

Adopters usually push straight to `main`, so CI, which runs on pull requests, rarely checks their changes, while most test suites use the Filler content as their fixture and fail once an Adopter replaces it. Deploy therefore runs the type check and `biome lint` before it builds, since neither depends on content, and leaves the test suites to CI. An Adopter whose content has replaced the Filler content can deploy without editing tests.

## Considered Options

- **Document it only**: type errors would still deploy without warning.
- **Deploy waits for the full CI**: breaks every Adopter's deploys once their content replaces the Filler content.
- **Split the tests into content-independent and Filler-dependent suites**: the most thorough option, but large enough to need its own spec. It remains open for a later version.
