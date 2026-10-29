# Releasing the Theme

How a release goes from its PR to a published, tagged GitHub Release that Adopters can update to. Branch names and how a release PR merges are in `issue-tracker.md` under **Closing work**.

A release is a one-way door: Adopters' update steps fetch its tag as `theme/vX.Y.Z`, so once published the tag never moves. Each step below ends on something checkable; finish it before starting the next.

## 1. Before the release PR is marked ready

- **Version:** bump `version` in `package.json`. Nothing else holds it.
- **Audit:** `aube audit` reports no known vulnerabilities. If advisories in dependencies-of-dependencies survive `aube update` (even with `--depth Infinity`, it keeps them at their installed versions), delete `pnpm-lock.yaml` and `node_modules`, run `aube install`, and audit again.
- **Update trial:** `docs/agents/update-trial.sh <previous-tag> <release-branch>` passes against the pushed release branch. It checks the README's "Updating from the Theme" commands as an Adopter would run them. When it fails, fix the README or the release, not the trial, unless the trial's own Adopter edits no longer fit the Theme.
- **Share images, only if `src/share-image/` changed:** confirm they come out byte-identical on GitHub's runners (ADR 0005). Push a throwaway branch from the release tip whose only commit is a workflow that runs `on: push` for that branch, in a matrix of 4 `ubuntu-latest` jobs: `jdx/mise-action`, `aube ci`, `aube run build`, then print `lscpu` and `sha256sum dist/blog/*/share.png`. Every job's hashes match a local build of the same commit. Delete the branch afterwards.

## 2. Release notes and PR body

Collect the release notes' **by-hand items** while the work happens, each time a change asks something of Adopters (a stricter Site config field, a renamed or removed file, a content convention), rather than reconstructing them at the end. The notes have two parts, as in v1.0.0's and v2.0.0's Releases:

1. **What changed:** the user-visible changes, with their issues.
2. **What you must do by hand:** numbered, each with the exact value or command, starting with a pointer to the README's "Updating from the Theme".

Write the PR body with `/pr`, with the update trial and audit in its Evidence. The PR is ready when CI passes and the body closes the spec and every ticket.

## 3. The user merges

The user reviews and merges the release PR themselves, with a merge commit. The merge deploys the live demo.

## 4. Deploy

Deploy's run on the merge commit succeeds, and the live demo (`siteConfig.url` + `base`) serves the release: every Section loads, a missing page returns 404, and a generated share image's hash matches a local build of the merge commit.

## 5. Tag

Tags are GPG-signed, like `v1.0.0`'s and `v2.0.0`'s:

```sh
git tag -s vX.Y.Z -m "Nord Portfolio Astro Theme vX.Y.Z" <merge-commit>
git push origin vX.Y.Z
```

Signing asks for the user's passphrase through their pinentry prompt, which works from an agent's session, as commit signing does. The step is done when `git tag -v vX.Y.Z` shows a good signature, the tag points at the merge commit, and GitHub reports it verified (`gh api repos/{owner}/{repo}/git/tags/<tag-object-sha> --jq .verification`).

## 6. Publish the Release

```sh
gh release create vX.Y.Z --verify-tag --title "vX.Y.Z" --latest --notes-file <notes.md>
```

`--verify-tag` makes the Release attach to the signed tag and never create an unsigned one. Done when `gh release list` shows it as Latest.
