# Change Summary

## [2026-08-05 18:32] Commit Summary

**Change Type:** Feature
**Scope:** Release configuration, GHCR publishing

**Summary:**
Dependency-only commits (`chore(deps)`/`chore(deps-dev)`) now trigger their
own patch release and show up in the changelog under a "Dependencies"
section instead of staying silently hidden. Added a `publish-versioned-image`
job to `release.yml` that runs immediately after a release, publishing one
GHCR image tagged with both `latest` and the release version (e.g. `1.0.2`),
so a specific release can be pinned instead of only ever running whatever
`latest` currently points to.

**Rationale:**
Merging the 7 pending Dependabot PRs (#22-#28) produced no release at all,
because plain `chore` commits don't bump a version under the default
`conventionalcommits` rules — confirmed by checking why none of today's 7
merges cut a release. Versioned images were considered and rejected as
out-of-scope at first (the existing `publish-container.yml` + `latest`-only
tag already satisfies "keep the image updated" literally, and
`docker-compose.yml` intentionally pulls `:latest`), but the user clarified
that images should be pinnable by version, not `latest`-only, so a version
tag was added instead. The versioned-image publish had to live inside
`release.yml` as a same-run follow-up job rather than as a new trigger on
`publish-container.yml`, because GitHub Actions never lets a workflow run
authenticated with the default `GITHUB_TOKEN` start another workflow run —
confirmed against GitHub's own documentation and empirically, by checking
that `publish-container.yml` never ran for either past release commit
(`8e63f57`, `461bb8e`). `publish-container.yml` itself is unchanged.

**Bug Fix Context (if applicable):**
Not applicable.

**References:**

- TODO.md: 2026-08-05 Versioned Release Images and Dependency Auto-Release
- Issue: Not applicable

## [2026-07-24 22:23] Commit Summary

**Change Type:** Fix
**Scope:** Pages workflow concurrency

**Summary:**
Scope the Pages concurrency group per ref and restrict cancellation to pull
request events, with contract tests asserting both.

**Rationale:**
Deployment correctness outranks runner minutes. Pull request builds keep
cancelling their own superseded runs, which is where the savings actually
came from, while a push to `main` now queues instead of being cancelled.

**Bug Fix Context (if applicable):**
The workflow used the static concurrency group `pages` with
`cancel-in-progress: true`, placing every branch and event in one bucket. The
newly added Dependabot version updates opened fourteen pull requests at once,
and their builds entered that shared group and cancelled the in-flight
production deploy for the `main` merge: `build` succeeded at 05:15:34 and
`deploy` was cancelled three seconds after starting. The last successful
production deploy was 2026-06-26, so the live site did not carry the merged
application changes. Per-ref grouping makes a pull request build unable to
reach the group a production deploy runs in.

**References:**

- TODO.md: 2026-07-24 Pages Concurrency Cancels Production Deploys
- Issue: Not applicable

## [2026-07-24 21:40] Commit Summary

**Change Type:** Docs
**Scope:** Automated release and changelog

**Summary:**
Record in the plan that a dry run reports no version on any branch other than
`main`, matching the note already published in the README.

**Rationale:**
The plan named two possible dry-run outcomes and omitted the one a contributor
actually sees on a feature branch, which reads as a failure rather than as the
branch restriction working.

**Bug Fix Context (if applicable):**
Not applicable.

**References:**

- TODO.md: 2026-07-24 Automated Release and Changelog
- Issue: Not applicable

## [2026-07-24 22:00] Commit Summary

**Change Type:** Fix
**Scope:** Release configuration

**Summary:**
Pin `conventional-changelog-conventionalcommits` to `8.0.0` (last version
compatible with writer v8), restore the `hidden` key that preset v8 actually
reads, add the `revert` type, pin the pages workflow to `.nvmrc` so its Node
version matches the branch's raised floor, and add a `concurrency` guard to
the release workflow so overlapping pushes to `main` cannot start two release
jobs. Add a runtime test that renders real notes through the installed
preset instead of only inspecting `.releaserc.json` shape, plus two guard
tests for the pages Node version and release concurrency.

**Rationale:**
Sixteen existing tests all asserted on the shape of `.releaserc.json` and
never once invoked the preset, so a config that rendered nothing could still
pass every test. The new runtime test closes that gap by calling
`generateNotes` with synthetic commits and asserting on the actual Markdown
output, which is the only way this class of bug is caught before a release.

**Bug Fix Context (if applicable):**
`@semantic-release/release-notes-generator@14.1.1` depends on
`conventional-changelog-writer@^8`, which renders sections using Handlebars
_string_ templates. `conventional-changelog-conventionalcommits@9` and later
switched to Handlebars _function_ templates, and also renamed the per-type
visibility flag from `hidden` to `effect`. With `conventionalcommits@10.2.1`
installed against writer v8, the mismatched template format meant every
section, commit bullet, and BREAKING CHANGES block rendered as nothing — the
generated notes were exactly `## 1.0.0 (2026-07-25)` and nothing else, with
no warning or error. Downgrading the preset to `8.0.0` restores template
compatibility with the installed writer, and switching `effect: "hidden"`
back to `hidden: true` restores the visibility flag the v8 preset actually
reads. Verified by rendering real notes from four synthetic commits (feat,
fix, hidden chore, and a breaking-change feat): `### Features`,
`### Bug Fixes`, and `### ⚠ BREAKING CHANGES` all rendered with their commit
bullets, and the hidden chore did not appear anywhere in the output.

**References:**

- TODO.md: 2026-07-24 Automated Release and Changelog
- Issue: Not applicable

## [2026-07-24 21:45] Commit Summary

**Change Type:** Fix
**Scope:** Release configuration

**Summary:**
Replace the silently-ignored `hidden` key with `effect: "hidden"` so that
`style`, `test`, and `chore` commit types are correctly excluded from the
changelog. Update the test filters to match the new key. Correct the README
claim that the changelog overwrites hand-written changes — it actually prepends,
so manual additions survive but become interleaved.

**Rationale:**
The `conventional-changelog-conventionalcommits@10.2.1` preset checks
`entry.effect` and defaults to `"bump"`, so `"hidden": true` was silently
ignored and those types rendered under an `undefined` section. The contract
test passed against broken configuration because it filtered on the wrong key.
The changelog prepends notes rather than rewriting, which is materially
different from the documented behavior.

**Bug Fix Context (if applicable):**
The `hidden` key is a local invention, not part of the preset's type schema. The
preset's own `isTypeEffect` function (source: `utils.js:51-53`) recognizes only
the `effect` field and defaults to `"bump"` when unset. With `"hidden": true`,
`'bump' === 'hidden'` is false, so the type is not hidden. The test asserted
against `entry.hidden` instead of `entry.effect`, allowing it to pass without
catching the misconfiguration.

**References:**

- TODO.md: 2026-07-24 Automated Release and Changelog
- Issue: Not applicable

## [2026-07-24 21:30] Commit Summary

**Change Type:** Docs
**Scope:** Release process

**Summary:**
Document that releases are automatic, which commit types produce which version
bump, which types appear in the changelog without cutting a release, how to
preview a release, and that `CHANGELOG.md` is generated rather than edited.

**Rationale:**
The mapping from commit type to version bump is the one piece of knowledge a
contributor needs before writing a commit message, and it is otherwise only
discoverable by reading `.releaserc.json`.

**Bug Fix Context (if applicable):**
Not applicable.

**References:**

- TODO.md: 2026-07-24 Automated Release and Changelog
- Issue: Not applicable

## [2026-07-24 21:15] Commit Summary

**Change Type:** Fix
**Scope:** Pages workflow

**Summary:**
Remove the `deploy_preview` job from the Pages workflow. Pull requests continue
to run the `build` job, so dependency installation, type checking, and the
production build remain verified.

**Rationale:**
A check that always fails trains readers to ignore all checks, which costs more
than the preview was ever worth.

**Bug Fix Context (if applicable):**
The `github-pages` environment restricts deployments to `main`, and GitHub Pages
serves a single site per repository, so `actions/deploy-pages` cannot produce a
per-pull-request preview. The job had therefore failed on every pull request
since it was added, including unrelated Dependabot pull requests. Removing it
makes a red check mean something again.

**References:**

- TODO.md: 2026-07-24 Automated Release and Changelog
- Issue: Not applicable

## [2026-07-24 21:00] Commit Summary

**Change Type:** Feature
**Scope:** Dependency update messages

**Summary:**
Add a Dependabot configuration that prefixes npm and GitHub Actions updates
with `chore(deps)`, groups npm updates into a single pull request, and runs
weekly.

**Rationale:**
Dependabot had no configuration and used default messages such as
`Bump vite in the npm_and_yarn group`, which no convention parser recognizes
and which the new commit hook cannot reach, because those commits are authored
by GitHub rather than locally. The `chore` type keeps dependency bumps in
history without asserting a user-facing change, so they do not cut releases on
their own. Grouping limits the pull request volume that enabling version
updates would otherwise create.

**Bug Fix Context (if applicable):**
Not applicable.

**References:**

- TODO.md: 2026-07-24 Automated Release and Changelog
- Issue: Not applicable

## [2026-07-24 20:45] Commit Summary

**Change Type:** Feature
**Scope:** Release workflow

**Summary:**
Add a `main`-triggered workflow that runs semantic-release with SHA-pinned
actions, full history checkout, and an explicit least-privilege permissions
block, plus contract tests asserting each of those properties.

**Rationale:**
The repository default for `GITHUB_TOKEN` is read-only, so the job must declare
`contents: write` explicitly or the release push fails. Full history is
required because semantic-release derives the previous version from git tags,
and a shallow clone would make every release look like the first.

**Bug Fix Context (if applicable):**
Not applicable.

**References:**

- TODO.md: 2026-07-24 Automated Release and Changelog
- Issue: Not applicable

## [2026-07-24 20:30] Commit Summary

**Change Type:** Feature
**Scope:** Release configuration

**Summary:**
Add `.releaserc.json` with the six-plugin release pipeline, an executable
contract test asserting plugin order and options, and raise the pinned Node
version to 22.23.1.

**Rationale:**
The `conventionalcommits` preset hides `docs`, `refactor`, `style`, `test`, and
`chore` by default, which would have produced a changelog nearly empty of this
repository's actual work, so an explicit type map assigns visible sections. The
Node floor rose because the changelog and git plugins require 22.22.2 or later
and the pinned 22.17.1 did not satisfy it.

**Bug Fix Context (if applicable):**
Not applicable.

**References:**

- TODO.md: 2026-07-24 Automated Release and Changelog
- Issue: Not applicable

## [2026-07-24 20:15] Commit Summary

**Change Type:** Feature
**Scope:** Commit message enforcement

**Summary:**
Add commitlint and a husky `commit-msg` hook so a non-conventional commit
message is rejected before it is recorded. Remove the husky sample
`pre-commit` hook, which would have run the watch-mode test runner and hung
every commit.

**Rationale:**
Automated releasing reads commit messages as its only input, so an invalid
message silently produces a wrong version or no release at all. Validating at
authorship fails while the message is still cheap to fix, rather than after a
push when correcting it requires an interactive rebase.

**Bug Fix Context (if applicable):**
Not applicable.

**References:**

- TODO.md: 2026-07-24 Automated Release and Changelog
- Issue: Not applicable

## [2026-07-24 20:19] Commit Summary

**Change Type:** Docs
**Scope:** Automated release and changelog

**Summary:**
Add the six-task implementation plan and correct it to declare the changelog
preset once at the configuration root rather than repeating it under each
plugin.

**Rationale:**
The plan originally claimed the analyzer and the notes generator resolve the
preset independently and share no options. The semantic-release source
contradicts this: each plugin is bound with the global options spread into its
own configuration, so a root-level declaration reaches both. Declaring it once
removes roughly twenty-four duplicated lines that could otherwise drift apart.

**Bug Fix Context (if applicable):**
Not applicable.

**References:**

- TODO.md: 2026-07-24 Automated Release and Changelog
- Issue: Not applicable

## [2026-07-24 19:56] Commit Summary

**Change Type:** Docs
**Scope:** Automated release and changelog

**Summary:**
Record the design for deriving versions, tags, GitHub Releases, and
`CHANGELOG.md` from Conventional Commits, including the plugin order, loop
prevention, required workflow permissions, Dependabot message prefix, and the
removal of the unachievable Pages preview deployment.

**Rationale:**
`semantic-release` was chosen over `release-please` and `changesets` because it
already runs in a sibling repository, so both projects share one release model.
Releasing is kept independent of deployment so that a documentation-only commit
still deploys and a failed release never withholds a working build. Commit
messages are validated at authorship rather than in continuous integration so
an invalid message fails before it is recorded, when it is still cheap to fix.

**Bug Fix Context (if applicable):**
The Pages workflow defines a `deploy_preview` job that has failed on every pull
request since it was added. The `github-pages` environment restricts
deployments to `main`, and GitHub Pages serves a single site per repository, so
per-pull-request previews are unreachable through `actions/deploy-pages`. The
design removes the job so the remaining checks report the real state of a
branch.

**References:**

- TODO.md: 2026-07-24 Automated Release and Changelog
- Issue: Not applicable

## [2026-07-24 17:15] Commit Summary

**Change Type:** Docs
**Scope:** GHCR-backed local runtime

**Summary:**
Document first publication, public package visibility, latest-image startup,
immutable commit rollback, logs, health waiting, response verification, and
shutdown.

**Rationale:**
The repository configuration and the external package lifecycle complete at
different times. Explicit first-publication instructions prevent a valid
Compose file from being mistaken for an image that already exists in GHCR.

**Bug Fix Context (if applicable):**
The previous README contained no Docker Compose instructions and did not explain
why the unpublished registry image cannot yet be started.

**References:**

- TODO.md: 2026-07-24 GHCR-backed Docker Compose Runtime
- Issue: Not applicable

## [2026-07-24 17:13] Commit Summary

**Change Type:** Feature
**Scope:** GHCR publication and Docker Compose

**Summary:**
Add the always-pull Compose service, filtered Docker build context, pinned
multi-platform GHCR publication workflow, provenance attestation, and
executable configuration contract.

**Rationale:**
GitHub Actions now owns the shared production image while Compose consumes that
artifact without a local build fallback. Structured tests validate the
configuration GitHub and Docker consume rather than matching source text.

**Bug Fix Context (if applicable):**
The repository previously had no Compose configuration, causing
`docker compose up` to fail before resolving any service.

**References:**

- TODO.md: 2026-07-24 GHCR-backed Docker Compose Runtime
- Issue: Not applicable

## [2026-07-24 16:44] Commit Summary

**Change Type:** Fix
**Scope:** Clean CI baseline

**Summary:**
Declare the flat ESLint configuration dependencies, resolve the rules they
activate, make browser storage deterministic in Node 26 tests, and stabilize
the countdown change callback.

**Rationale:**
A clean installation must load the configured lint rules and exercise the same
provider boundary used in production. Separating the theme context preserves
Fast Refresh, while a stable picker callback prevents elapsed countdown values
from being revalidated and cleared.

**Bug Fix Context (if applicable):**
`npm run ci` failed first on missing ESLint imports, then on latent lint errors
and a Node 26 storage collision. The App integration test also exposed a
feedback loop that cleared the target before rendering the finished state.

**References:**

- TODO.md: 2026-07-24 GHCR-backed Docker Compose Runtime
- Issue: Not applicable

## [2026-07-24 16:32] Commit Summary

**Change Type:** Docs
**Scope:** GHCR configuration testing

**Summary:**
Replace workflow source-text checks in the implementation plan with structured
YAML contract assertions.

**Rationale:**
Parsing the workflow verifies the configuration GitHub consumes and permits
intentional action upgrades while still enforcing immutable commit pins.

**Bug Fix Context (if applicable):**
The initial plan would have tested workflow text rather than its parsed
behavior.

**References:**

- TODO.md: 2026-07-24 GHCR-backed Docker Compose Runtime
- Issue: Not applicable

## [2026-07-24 16:19] Commit Summary

**Change Type:** Docs
**Scope:** GHCR-backed Docker Compose runtime

**Summary:**
Replace the local-image Compose design with the approved GHCR publication and
always-pull workflow, including exact implementation and verification steps.

**Rationale:**
Compose must consume the same multi-platform artifact published from `main`,
while immutable commit tags preserve rollback even though local startup follows
the mutable `latest` tag.

**Bug Fix Context (if applicable):**
The previous plan never created `compose.yaml`, causing Docker Compose to fail
with `no configuration file provided: not found`.

**References:**

- TODO.md: 2026-07-24 GHCR-backed Docker Compose Runtime
- Issue: Not applicable

## [2026-07-24 15:01] Commit Summary

**Change Type:** Chore
**Scope:** Git worktree isolation

**Summary:**
Ignore the project-local worktree directory used for isolated feature
implementation.

**Rationale:**
Keeping linked worktrees out of version control prevents nested checkout
contents from appearing as repository changes during subagent execution.

**Bug Fix Context (if applicable):**
Not applicable.

**References:**

- TODO.md: 2026-07-24 Local Docker Compose Runtime
- Issue: Not applicable

## [2026-07-24 14:53] Commit Summary

**Change Type:** Docs
**Scope:** Docker Compose local runtime

**Summary:**
Add the task-by-task implementation plan for the approved local Docker Compose
workflow.

**Rationale:**
The plan records the executable red-green contract, exact configuration, full
verification sequence, and atomic commit boundaries before implementation
begins.

**Bug Fix Context (if applicable):**
Not applicable.

**References:**

- TODO.md: 2026-07-24 Local Docker Compose Runtime
- Issue: Not applicable

## [2026-07-24 14:50] Commit Summary

**Change Type:** Docs  
**Scope:** Docker Compose local runtime

**Summary:**  
Document the approved production-like Docker Compose design and record its
implementation plan, test strategy, and tradeoffs.

**Rationale:**  
The existing multi-stage Dockerfile already defines the production artifact.
Reusing it from Compose avoids a second build path and keeps the local runtime
representative of production.

**Bug Fix Context (if applicable):**  
Not applicable.

**References:**

- TODO.md: 2026-07-24 Local Docker Compose Runtime
- Issue: Not applicable
