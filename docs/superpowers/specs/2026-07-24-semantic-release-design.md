# Automated Release and Changelog Design

## Objective

Derive every version number, git tag, GitHub Release, and changelog entry from
Conventional Commit messages on `main`, so that releasing requires no manual
step and no hand-maintained version history.

## Acceptance Criteria

- A merge to `main` containing a releasable commit produces a git tag, a GitHub
  Release, and an updated `CHANGELOG.md` without human action.
- `feat` produces a minor bump, `fix` produces a patch bump, and a
  `BREAKING CHANGE` footer produces a major bump.
- The release commit does not retrigger the release, container, or Pages
  workflows.
- `package.json` version tracks the released version; nothing publishes to the
  npm registry.
- A non-conventional commit message is rejected locally before it is recorded.
- Dependabot commits are conventional and do not by themselves trigger a
  release.
- The GitHub Pages production deployment continues to publish from `main` on
  every push, unchanged in timing and content.
- Pull request checks report the real state of the branch, with no step that
  fails by construction.

## Architecture

Releasing is a consumer of commit history, not a separate process to maintain.
`semantic-release` runs in GitHub Actions on pushes to `main`, reads every
commit since the previous tag, computes the next version, and writes the
artifacts back to the repository.

Deployment remains independent. GitHub Pages and GHCR continue to publish on
push to `main` as they do today. Releasing records what shipped; it does not
gate or reorder shipping. This keeps a documentation-only commit from blocking
a deployment and keeps a failed release from withholding a working build.

Message quality is enforced at the point of authorship rather than discovered
in CI. A `commit-msg` hook runs `commitlint` against
`@commitlint/config-conventional`, so an invalid message fails at
`git commit` instead of after a push.

## Release Pipeline

The plugin order is significant; each stage consumes the previous one.

1. `@semantic-release/commit-analyzer` determines the release type.
2. `@semantic-release/release-notes-generator` renders the notes.
3. `@semantic-release/changelog` writes `CHANGELOG.md`.
4. `@semantic-release/npm` updates the `package.json` version with
   `npmPublish` disabled.
5. `@semantic-release/git` commits `CHANGELOG.md` and `package.json` as
   `chore(release): ${nextRelease.version} [skip ci]`.
6. `@semantic-release/github` creates the GitHub Release.

Both the analyzer and the notes generator use the `conventionalcommits` preset
rather than the Angular default. The preset alone is not sufficient: it hides
`docs`, `refactor`, `style`, `test`, and `chore` by default, so the
configuration supplies an explicit `presetConfig.types` map that assigns a
visible section to `docs`, `refactor`, `build`, and `perf`, and leaves `style`,
`test`, and `chore` hidden.

Section visibility and release type are independent. `refactor`, `docs`, and
`build` appear in a changelog without triggering a release on their own; they
are recorded when some other commit causes a version to be cut. Only `feat`,
`fix`, `perf`, and a `BREAKING CHANGE` footer produce a bump.

The repository is marked `private`, so no package is published. The npm plugin
is present only to keep the version field synchronized with the tag.

## Loop Prevention

Two independent mechanisms prevent a release from triggering another release.
The release commit message carries `[skip ci]`, and commits pushed with
`GITHUB_TOKEN` do not start new workflow runs. Either alone is sufficient;
both are retained because each protects against a different future change.

## Permissions

The repository default for `GITHUB_TOKEN` is read-only, so the release job
declares its own permissions: `contents: write` to push the release commit and
tag, and `issues: write` and `pull-requests: write` so the GitHub plugin can
comment on the items included in a release. No personal access token is used.
`main` carries no branch protection, so the release commit needs no bypass.

## Pull Request Feedback Repair

The Pages workflow defines a `deploy_preview` job that runs on every pull
request and cannot succeed. The `github-pages` environment restricts
deployments to `main`, and GitHub Pages serves a single site per repository, so
per-pull-request preview URLs are not achievable through `actions/deploy-pages`.
Every pull request has therefore reported a failure unrelated to its contents.

The job is removed. The `build` job continues to run on pull requests, so
dependency installation, type checking, and the production build remain
verified. Removing a step that always fails is what makes the remaining checks
meaningful.

## Dependency Update Messages

Dependabot has no configuration file and uses default messages such as
`Bump vite in the npm_and_yarn group`, which no convention parser recognizes.
A configuration file sets the `chore(deps)` prefix for both npm and GitHub
Actions updates. The `chore` type is intentional: a dependency bump records
itself in history and satisfies the convention without asserting a user-facing
change.

## First Release

No git tag exists, so `semantic-release` treats the next qualifying push as an
initial release and publishes `1.0.0`, matching the version already recorded in
`package.json`. Only commits after that tag are analyzed thereafter, so the
forty non-conventional commits in the existing history are ignored rather than
rewritten.

## Verification

`npx semantic-release --dry-run` reports the computed version and rendered
notes without writing to the repository or the registry, and is the check to
run before the first real release. The commit hook is verified by attempting a
deliberately malformed message and confirming rejection, then confirming that a
conventional message is accepted. After the first release, the tag, the GitHub
Release, the `CHANGELOG.md` contents, and an unchanged Pages deployment are
confirmed directly.

## Scope Boundaries

This feature does not gate deployment on releases, publish to the npm registry,
rewrite existing commit history, add a continuous integration check for commit
messages, introduce prerelease or maintenance channels, expose the version
inside the running application, or replace GitHub Pages with a host capable of
per-pull-request previews.
