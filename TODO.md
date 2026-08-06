# TODO

## [2026-07-24] Fix: Pages Concurrency Cancels Production Deploys

**Objective:**
Stop a pull request build from cancelling the production GitHub Pages deploy.

**Approach:**
Scope the workflow concurrency group per ref instead of the static name
`pages`, and cancel in progress only for pull request events, so superseded
pull request builds still cancel themselves while a push to `main` queues.

**Tests:**
Two contract assertions: the group name is not the static `pages` and derives
from `github.ref`, and cancellation is conditional on the event being a pull
request.

**Risks & Tradeoffs:**
Concurrent pushes to `main` now queue rather than cancel, so a rapid second
push waits for the first deploy instead of superseding it. That is the
intended trade: a slower queue is preferable to a skipped deployment.

## [2026-07-24] Feature: Automated Release and Changelog

**Objective:**
Derive every version number, git tag, GitHub Release, and changelog entry from
Conventional Commit messages on `main`, so releasing requires no manual step
and no hand-maintained version history.

**Approach:**
Run `semantic-release` in GitHub Actions on pushes to `main` with the
`conventionalcommits` preset, writing `CHANGELOG.md`, the `package.json`
version, a git tag, and a GitHub Release. Keep deployment independent: Pages
and GHCR continue publishing on push to `main`, unchanged. Enforce message
quality at authorship with a `commitlint` `commit-msg` hook rather than in CI.
Give Dependabot a `chore(deps)` prefix so its commits parse. Remove the Pages
`deploy_preview` job, which cannot succeed because the `github-pages`
environment restricts deployments to `main`.

**Tests:**
Run `npx semantic-release --dry-run` to confirm the computed version and
rendered notes without writing anything. Verify the commit hook by attempting a
malformed message and confirming rejection, then confirming a conventional
message is accepted. After the first release, confirm the tag, the GitHub
Release, the `CHANGELOG.md` contents, and an unchanged Pages deployment.

**Risks & Tradeoffs:**
The hook is bypassable with `--no-verify`, and no continuous integration check
backs it up, so one bypassed commit can produce a wrong bump or no release.
The forty non-conventional commits already on `main` are ignored rather than
rewritten, so the first changelog begins at the initial release instead of
reconstructing history. Because the release commit carries `[skip ci]`, the
deployed site never contains its own version number.

## [2026-07-24] Feature: GHCR-backed Docker Compose Runtime

**Objective:**
Publish the production countdown timer as a public multi-platform GHCR image
and make `docker compose up` always pull its latest version for local use at
`http://localhost:8080`.

**Approach:**
Add a pinned GitHub Actions workflow that publishes `latest` and immutable
commit tags from `main`. Add a single-service Compose configuration that pulls
`ghcr.io/rgoshen/countdown-timer-ts:latest`, publishes nginx on port 8080, and
reports container health. Repair the missing direct lint dependencies exposed
by a clean install, filter the Docker build context, and document the workflow.

**Tests:**
Use an executable Node contract to validate the Compose and publication
configuration, run the existing CI suite from a clean install, format-check
the YAML, and build and smoke-test the production image locally. After merge,
verify the GitHub Actions publication, public package visibility, anonymous
pull, container health, and host HTTP response.

**Risks & Tradeoffs:**
The mutable `latest` tag favors convenience over reproducibility, so each
publication also retains a commit-specific tag for rollback. GHCR creates the
first package as private; anonymous Compose startup becomes available only
after the first `main` publication and a one-time visibility change to public.

## [2026-08-05] Feature: Versioned Release Images and Dependency Auto-Release

**Objective:**
Make dependency-only commits (`chore(deps)`/`chore(deps-dev)`) trigger their
own patch release like any other change, and publish a version-tagged GHCR
image alongside `latest` for every release, so a specific release can be
pinned instead of only ever running whatever `latest` currently points to.

**Approach:**
Add `releaseRules` to the `commit-analyzer` plugin so `chore(deps)` and
`chore(deps-dev)` commits bump patch. Custom rules are checked first and fall
through to the existing `conventionalcommits` preset for everything else
(confirmed against the plugin's own documentation), so `feat`/`fix` bump
behavior is unaffected. Surface both scopes in the changelog under a visible
"Dependencies" section instead of hiding them; plain unscoped `chore:` commits
stay hidden. Add a `publish-versioned-image` job to `release.yml` that runs in
the same workflow run immediately after the `release` job, gated on whether
`package.json`'s version actually changed (semantic-release exits
successfully whether or not it released, so the job diffs the version before
and after). It checks out the release tag itself (`v<version>`, immutable
once created, sidestepping any race with a later push to `main`) and builds
one image carrying both `:latest` and `:<version>` tags together, so both
always come from the identical build. This has to live inside `release.yml`
rather than as a new trigger on `publish-container.yml`, because GitHub
Actions never lets a workflow run authenticated with the default
`GITHUB_TOKEN` start another workflow run (confirmed against GitHub's docs) —
no push, tag, or Release created by `npx semantic-release` can trigger a
second workflow here, `[skip ci]` or not, without a personal access token
this repo doesn't have. `publish-container.yml` itself is untouched and keeps
publishing `latest`/`sha-*` on every push to `main`.

**Tests:**
Extend `scripts/verify-release-config.mjs` with an `analyzeCommits`-based test
proving `chore(deps)`/`chore(deps-dev)` commits alone now recommend a patch
release, and a `generateNotes`-based test proving they render under a visible
"Dependencies" heading while a plain `chore:` commit stays hidden. Extend
`scripts/verify-container-config.mjs` to assert the new job's trigger
condition, permissions, tag list, and that its actions stay SHA-pinned,
matching the existing pattern already asserted for `publish-container.yml`.

**Risks & Tradeoffs:**
Every dependency-only merge now produces its own release, tag, GitHub
Release, and image build instead of batching silently until the next real
change — more releases and more GHCR build minutes for what's often a
one-line lockfile bump. The effect is retroactive as soon as this merges: the
7 dependency commits already on `main` since v1.0.1 become part of the very
next release.
