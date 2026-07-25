# TODO

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
