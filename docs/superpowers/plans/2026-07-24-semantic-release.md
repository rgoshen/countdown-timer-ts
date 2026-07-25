# Automated Release and Changelog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Derive every version number, git tag, GitHub Release, and `CHANGELOG.md` entry from Conventional Commit messages on `main`, with no manual release step.

**Architecture:** `semantic-release` runs in GitHub Actions on pushes to `main`, reads commits since the previous tag, computes the next version, and writes the tag, Release, changelog, and `package.json` version back to the repository. Deployment stays independent — GitHub Pages and GHCR continue publishing on push to `main`, unchanged. Commit message validity is enforced at authorship by a `commitlint` `commit-msg` hook rather than in CI.

**Tech Stack:** semantic-release 25, @semantic-release/changelog 7, @semantic-release/git 11, conventional-changelog-conventionalcommits 10, @commitlint/cli 21, @commitlint/config-conventional 21, husky 9, Node 22.23.1, GitHub Actions.

## Global Constraints

- Every dependency added to `package.json` is pinned to an exact version, with no `^` or `~` range. This matches the existing `@eslint/js`, `globals`, `yaml`, and `typescript-eslint` entries.
- Every commit message in this plan is a Conventional Commit. The `commit-msg` hook is live from Task 1 onward and will reject anything else.
- `SUMMARY.md` gains a new entry immediately before every commit, newest at the top, in the existing format. `TODO.md` already holds the feature entry and is not modified again.
- No commit contains a co-author trailer, an AI-generation trailer, or any reference to how it was produced.
- `.releaserc.json` and the release workflow reference the branch `main` only. No prerelease or maintenance channels.
- GitHub Actions are pinned to full 40-character commit SHAs with the version as a trailing comment, matching `.github/workflows/publish-container.yml`.
- Node floor is `22.23.1`. `@semantic-release/changelog@7.0.0` and `@semantic-release/git@11.0.1` declare `engines.node` of `^22.22.2 || >=24.15`, and the current `.nvmrc` value `v22.17.1` does not satisfy it.
- `package.json` is `"private": true`. Nothing publishes to the npm registry; `npmPublish` is `false`.

---

### Task 1: Enforce Conventional Commit messages locally

**Files:**
- Create: `commitlint.config.js`
- Create: `.husky/commit-msg`
- Modify: `package.json` (devDependencies, scripts)
- Modify: `.gitignore` (already contains the `.superpowers/` entry; commit it with this task)
- Modify: `SUMMARY.md`

**Interfaces:**
- Consumes: nothing.
- Produces: a live `commit-msg` git hook. Every later task's commit step depends on its message passing this hook.

- [ ] **Step 1: Install the tooling at exact versions**

```bash
npm install --save-dev --save-exact \
  @commitlint/cli@21.2.1 \
  @commitlint/config-conventional@21.2.0 \
  husky@9.1.7
```

- [ ] **Step 2: Initialize husky**

```bash
npx husky init
```

This creates `.husky/pre-commit`, writes `.husky/_/` internals, and adds `"prepare": "husky"` to `package.json` scripts.

- [ ] **Step 3: Delete the sample pre-commit hook**

`husky init` writes a `.husky/pre-commit` containing `npm test`. In this repository `npm test` is `vitest` in **watch mode**, which never exits — that hook would hang every commit. Remove it.

```bash
rm .husky/pre-commit
```

- [ ] **Step 4: Write the commitlint config**

Create `commitlint.config.js`. `package.json` declares `"type": "module"`, so a `.js` config must use ESM `export default`.

```javascript
export default {
  extends: ["@commitlint/config-conventional"],
};
```

- [ ] **Step 5: Write the commit-msg hook**

Create `.husky/commit-msg` with exactly this single line. husky v9 hooks are plain shell; no shebang or sourcing boilerplate.

```sh
npx --no -- commitlint --edit "$1"
```

- [ ] **Step 6: Make the hook executable**

```bash
chmod +x .husky/commit-msg
```

- [ ] **Step 7: Verify the hook REJECTS a bad message**

```bash
git add -A
git commit -m "added some stuff"
```

Expected: FAILS. Output contains `subject may not be empty` or `type may not be empty`, and the commit is not created. Confirm with `git log --oneline -1` — the previous commit is still HEAD.

- [ ] **Step 8: Verify the hook ACCEPTS a good message, and commit**

Add the `SUMMARY.md` entry first, at the top, immediately under `# Change Summary`:

```markdown
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
```

Then commit:

```bash
git add package.json package-lock.json commitlint.config.js .husky .gitignore SUMMARY.md
git commit -m "feat: enforce conventional commit messages with commitlint"
```

Expected: PASSES. `git log --oneline -1` shows the new commit.

---

### Task 2: Configure semantic-release and raise the Node floor

**Files:**
- Create: `.releaserc.json`
- Create: `scripts/verify-release-config.mjs`
- Modify: `.nvmrc`
- Modify: `package.json` (devDependencies, scripts)
- Modify: `SUMMARY.md`

**Interfaces:**
- Consumes: the `commit-msg` hook from Task 1.
- Produces: `.releaserc.json` with a six-plugin pipeline; the npm script `test:release-config`; and `scripts/verify-release-config.mjs`, which Tasks 3, 4, and 5 each extend with additional `test(...)` blocks.

- [ ] **Step 1: Raise the Node floor**

Replace the entire contents of `.nvmrc` with:

```
v22.23.1
```

`v22.17.1` does not satisfy the `^22.22.2 || >=24.15` engine requirement of `@semantic-release/changelog@7.0.0` and `@semantic-release/git@11.0.1`.

- [ ] **Step 2: Activate the new Node version**

```bash
nvm install && nvm use && node --version
```

Expected: `v22.23.1`.

- [ ] **Step 3: Write the failing config contract test**

Create `scripts/verify-release-config.mjs`. This follows the existing `scripts/verify-container-config.mjs` pattern — `node:test` plus `node:assert/strict`, asserting against the parsed configuration rather than a text match.

```javascript
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const releaseConfig = JSON.parse(readFileSync(".releaserc.json", "utf8"));

const pluginName = (plugin) => (Array.isArray(plugin) ? plugin[0] : plugin);
const pluginOptions = (plugin) => (Array.isArray(plugin) ? plugin[1] : {});
const findPlugin = (name) =>
  releaseConfig.plugins.find((plugin) => pluginName(plugin) === name);

test("release runs only from main", () => {
  assert.deepEqual(releaseConfig.branches, ["main"]);
});

test("plugins run in dependency order", () => {
  assert.deepEqual(releaseConfig.plugins.map(pluginName), [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/git",
    "@semantic-release/github",
  ]);
});

test("the private package is never published to npm", () => {
  assert.equal(pluginOptions(findPlugin("@semantic-release/npm")).npmPublish, false);
});

test("the release commit cannot retrigger CI", () => {
  const message = pluginOptions(findPlugin("@semantic-release/git")).message;
  assert.match(message, /\[skip ci\]/);
  assert.match(message, /^chore\(release\):/);
});

test("the release commit carries the changelog and version files", () => {
  assert.deepEqual(pluginOptions(findPlugin("@semantic-release/git")).assets, [
    "CHANGELOG.md",
    "package.json",
    "package-lock.json",
  ]);
});

test("the preset is declared once at the root so both plugins inherit it", () => {
  assert.equal(releaseConfig.preset, "conventionalcommits");
  assert.equal(pluginOptions(findPlugin("@semantic-release/commit-analyzer")).preset, undefined);
  assert.equal(
    pluginOptions(findPlugin("@semantic-release/release-notes-generator")).preset,
    undefined,
  );
});

test("documentation and refactor commits are visible in the changelog", () => {
  const visible = new Map(
    releaseConfig.presetConfig.types
      .filter((entry) => !entry.hidden)
      .map((entry) => [entry.type, entry.section]),
  );
  for (const type of ["feat", "fix", "perf", "refactor", "docs", "build", "ci"]) {
    assert.ok(visible.has(type), `${type} should be visible`);
  }

  const hidden = new Set(
    releaseConfig.presetConfig.types
      .filter((entry) => entry.hidden)
      .map((entry) => entry.type),
  );
  for (const type of ["style", "test", "chore"]) {
    assert.ok(hidden.has(type), `${type} should be hidden`);
  }
});
```

- [ ] **Step 4: Add the test script**

Add to `package.json` `scripts`, immediately after the existing `test:container-config` line:

```json
"test:release-config": "node --test scripts/verify-release-config.mjs",
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm run test:release-config`
Expected: FAIL with `ENOENT: no such file or directory, open '.releaserc.json'`.

- [ ] **Step 6: Install semantic-release at exact versions**

Only these three are needed. `commit-analyzer`, `release-notes-generator`, `npm`, and `github` ship as dependencies of `semantic-release` core.

```bash
npm install --save-dev --save-exact \
  semantic-release@25.0.8 \
  @semantic-release/changelog@7.0.0 \
  @semantic-release/git@11.0.1 \
  conventional-changelog-conventionalcommits@10.2.1
```

- [ ] **Step 7: Write `.releaserc.json`**

`preset` and `presetConfig` are declared **once at the root**, not per plugin. semantic-release spreads global options into every plugin's config — `lib/plugins/normalize.js` binds each plugin with `cloneDeep({ ...options, ...config })` — so both `commit-analyzer` and `release-notes-generator` inherit them, and plugin-specific config still wins where it is set. Repeating the `types` array under each plugin would be ~24 duplicated lines that can silently drift apart.

```json
{
  "branches": ["main"],
  "preset": "conventionalcommits",
  "presetConfig": {
    "types": [
      { "type": "feat", "section": "Features" },
      { "type": "fix", "section": "Bug Fixes" },
      { "type": "perf", "section": "Performance Improvements" },
      { "type": "refactor", "section": "Code Refactoring" },
      { "type": "docs", "section": "Documentation" },
      { "type": "build", "section": "Build System" },
      { "type": "ci", "section": "Continuous Integration" },
      { "type": "style", "hidden": true },
      { "type": "test", "hidden": true },
      { "type": "chore", "hidden": true }
    ]
  },
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/changelog", { "changelogFile": "CHANGELOG.md" }],
    ["@semantic-release/npm", { "npmPublish": false }],
    [
      "@semantic-release/git",
      {
        "assets": ["CHANGELOG.md", "package.json", "package-lock.json"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ],
    "@semantic-release/github"
  ]
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm run test:release-config`
Expected: PASS, 7 tests.

- [ ] **Step 9: Preview the release without writing anything**

`--dry-run` performs no writes to the repository or GitHub. The token is needed only so the GitHub plugin can verify repository access.

```bash
GITHUB_TOKEN=$(gh auth token) npx semantic-release --dry-run
```

Expected: reports `The next release version is 1.0.0` and prints the rendered release notes. If it instead reports `There are no relevant changes, so no new version is released`, that is correct on a branch with no `feat`/`fix`/`perf` commits since the last tag — the first real release will come from merging a branch that has them.

- [ ] **Step 10: Commit**

Add the `SUMMARY.md` entry at the top, then commit.

```markdown
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
```

```bash
git add .releaserc.json .nvmrc scripts/verify-release-config.mjs package.json package-lock.json SUMMARY.md
git commit -m "feat: configure semantic-release with an explicit changelog type map"
```

---

### Task 3: Add the release workflow

**Files:**
- Create: `.github/workflows/release.yml`
- Modify: `scripts/verify-release-config.mjs`
- Modify: `SUMMARY.md`

**Interfaces:**
- Consumes: `.releaserc.json` from Task 2; the `test:release-config` script from Task 2.
- Produces: the workflow that executes releases. No later task depends on it.

- [ ] **Step 1: Write the failing workflow contract test**

Append to `scripts/verify-release-config.mjs`. Add the `yaml` import to the existing import block at the top of the file — `yaml@2.9.0` is already a dependency, used by the container config test.

```javascript
import { parse } from "yaml";

const releaseWorkflow = parse(
  readFileSync(".github/workflows/release.yml", "utf8"),
);

test("releases run only on pushes to main", () => {
  assert.deepEqual(releaseWorkflow.on.push.branches, ["main"]);
});

test("the release job can write contents, issues, and pull requests", () => {
  assert.deepEqual(releaseWorkflow.jobs.release.permissions, {
    contents: "write",
    issues: "write",
    "pull-requests": "write",
  });
});

test("checkout fetches full history so tags are visible", () => {
  const checkout = releaseWorkflow.jobs.release.steps.find((step) =>
    step.uses?.startsWith("actions/checkout@"),
  );
  assert.equal(checkout.with["fetch-depth"], 0);
  assert.equal(checkout.with["persist-credentials"], false);
});

test("the workflow node version tracks .nvmrc", () => {
  const setupNode = releaseWorkflow.jobs.release.steps.find((step) =>
    step.uses?.startsWith("actions/setup-node@"),
  );
  assert.equal(setupNode.with["node-version-file"], ".nvmrc");
});

test("every action is pinned to a full commit SHA", () => {
  for (const step of releaseWorkflow.jobs.release.steps) {
    if (!step.uses) continue;
    assert.match(step.uses, /@[0-9a-f]{40}$/, `${step.uses} must be SHA-pinned`);
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:release-config`
Expected: FAIL with `ENOENT: no such file or directory, open '.github/workflows/release.yml'`.

- [ ] **Step 3: Write the workflow**

`fetch-depth: 0` is mandatory — semantic-release reads the full tag history to determine the previous release. `persist-credentials: false` stops the checkout credential helper from conflicting with the authenticated push semantic-release performs using `GITHUB_TOKEN`.

```yaml
name: Release

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    permissions:
      contents: write # push the release commit and tag
      issues: write # comment on released issues
      pull-requests: write # comment on released pull requests
    steps:
      - name: Check out repository
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          fetch-depth: 0
          persist-credentials: false

      - name: Set up Node
        uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Install dependencies
        run: npm clean-install

      - name: Release
        run: npx semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:release-config`
Expected: PASS, 12 tests.

- [ ] **Step 5: Confirm formatting matches the repository style**

Run: `npx prettier --check .github/workflows/release.yml`
Expected: PASS. If it fails, run `npx prettier --write .github/workflows/release.yml` and re-run the contract test.

- [ ] **Step 6: Commit**

Add the `SUMMARY.md` entry at the top, then commit.

```markdown
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
```

```bash
git add .github/workflows/release.yml scripts/verify-release-config.mjs SUMMARY.md
git commit -m "ci: add the semantic-release workflow"
```

---

### Task 4: Make Dependabot commits conventional

**Files:**
- Create: `.github/dependabot.yml`
- Modify: `scripts/verify-release-config.mjs`
- Modify: `SUMMARY.md`

**Interfaces:**
- Consumes: the `test:release-config` script from Task 2.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Write the failing Dependabot contract test**

Append to `scripts/verify-release-config.mjs`:

```javascript
const dependabot = parse(readFileSync(".github/dependabot.yml", "utf8"));

test("every dependabot ecosystem writes conventional commit messages", () => {
  const ecosystems = dependabot.updates.map((update) => update["package-ecosystem"]);
  assert.deepEqual(ecosystems.sort(), ["github-actions", "npm"]);

  for (const update of dependabot.updates) {
    assert.equal(update["commit-message"].prefix, "chore(deps)");
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:release-config`
Expected: FAIL with `ENOENT: no such file or directory, open '.github/dependabot.yml'`.

- [ ] **Step 3: Write the Dependabot config**

`chore` is deliberate: a dependency bump records itself in history and satisfies the convention without asserting a user-facing change, so it appears in git history but triggers no release on its own.

```yaml
version: 2

updates:
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly
    commit-message:
      prefix: "chore(deps)"
      prefix-development: "chore(deps-dev)"
    groups:
      npm:
        patterns:
          - "*"

  - package-ecosystem: github-actions
    directory: "/"
    schedule:
      interval: weekly
    commit-message:
      prefix: "chore(deps)"
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:release-config`
Expected: PASS, 13 tests.

- [ ] **Step 5: Commit**

Add the `SUMMARY.md` entry at the top, then commit.

```markdown
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
```

```bash
git add .github/dependabot.yml scripts/verify-release-config.mjs SUMMARY.md
git commit -m "ci: give dependabot conventional commit messages"
```

---

### Task 5: Remove the unachievable Pages preview job

**Files:**
- Modify: `.github/workflows/pages.yml:51-63`
- Modify: `scripts/verify-release-config.mjs`
- Modify: `SUMMARY.md`

**Interfaces:**
- Consumes: the `test:release-config` script from Task 2.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Write the failing Pages contract test**

Append to `scripts/verify-release-config.mjs`:

```javascript
const pagesWorkflow = parse(readFileSync(".github/workflows/pages.yml", "utf8"));

test("no pull request job attempts a deployment that cannot succeed", () => {
  assert.equal(pagesWorkflow.jobs.deploy_preview, undefined);
});

test("pull requests still build, so checks remain meaningful", () => {
  assert.ok(pagesWorkflow.on.pull_request !== undefined);
  assert.ok(pagesWorkflow.jobs.build !== undefined);
});

test("production still deploys from main", () => {
  assert.match(pagesWorkflow.jobs.deploy.if, /refs\/heads\/main/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:release-config`
Expected: FAIL on the first assertion — `deploy_preview` is currently defined.

- [ ] **Step 3: Delete the deploy_preview job**

Remove lines 51-63 of `.github/workflows/pages.yml` in full — the `deploy_preview:` key and every line belonging to it, through the closing `preview: true` line. Change nothing else. The `on.pull_request` trigger stays, so the `build` job continues to validate pull requests.

The job is unreachable by construction: the `github-pages` environment restricts deployments to `main`, and GitHub Pages serves one site per repository, so `actions/deploy-pages` cannot produce per-pull-request preview URLs.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:release-config`
Expected: PASS, 16 tests.

- [ ] **Step 5: Confirm the remaining YAML is valid and formatted**

Run: `npx prettier --check .github/workflows/pages.yml`
Expected: PASS.

- [ ] **Step 6: Commit**

Add the `SUMMARY.md` entry at the top, then commit.

```markdown
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
```

```bash
git add .github/workflows/pages.yml scripts/verify-release-config.mjs SUMMARY.md
git commit -m "fix: remove the pages preview job that cannot succeed"
```

---

### Task 6: Document the release process

**Files:**
- Modify: `README.md`
- Modify: `SUMMARY.md`

**Interfaces:**
- Consumes: everything from Tasks 1-5.
- Produces: nothing.

- [ ] **Step 1: Add a Releases section to README.md**

Append this section to `README.md`, after the existing Docker Compose content.

```markdown
## Releases

Releases are automatic. Merging to `main` runs `semantic-release`, which reads
the Conventional Commit messages since the previous tag and, when at least one
of them qualifies, creates a git tag, publishes a GitHub Release, updates
`CHANGELOG.md`, and bumps the `package.json` version.

| Commit type | Release |
| --- | --- |
| `feat:` | minor |
| `fix:` | patch |
| `perf:` | patch |
| `BREAKING CHANGE:` footer | major |
| `docs:`, `refactor:`, `build:`, `ci:` | none, but listed in the changelog |
| `style:`, `test:`, `chore:` | none, and hidden from the changelog |

Commit messages are validated by a `commit-msg` hook, so an invalid message is
rejected before it is recorded. Run `npm install` once after cloning to
activate the hook.

To preview what the next release would be without changing anything:

```bash
GITHUB_TOKEN=$(gh auth token) npx semantic-release --dry-run
```

Run that from `main`. On any other branch it reports that semantic-release is
configured to publish only from `main` and computes no version — which is the
branch restriction working, not an error.

`CHANGELOG.md` is generated. Do not edit it by hand; the next release
overwrites hand-written changes.

Deployment is independent of releasing. GitHub Pages and the GHCR image publish
on every push to `main`, whether or not that push produces a release.
```

- [ ] **Step 2: Verify the README renders correctly**

Run: `npx prettier --check README.md`
Expected: PASS. If it fails, run `npx prettier --write README.md`.

- [ ] **Step 3: Commit**

Add the `SUMMARY.md` entry at the top, then commit.

```markdown
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
```

```bash
git add README.md SUMMARY.md
git commit -m "docs: document the automated release process"
```

---

## Post-Merge Verification

These cannot be verified before merging, because the workflow only runs on `main`.

- [ ] The `Release` workflow run succeeds on the merge commit.
- [ ] A `v1.0.0` tag exists: `git fetch --tags && git tag -l`.
- [ ] A GitHub Release exists: `gh release view v1.0.0`.
- [ ] `CHANGELOG.md` exists on `main` and contains the merged `feat` and `fix` entries under their sections.
- [ ] `package.json` on `main` reads `"version": "1.0.0"`.
- [ ] The release commit `chore(release): 1.0.0 [skip ci]` did **not** trigger a second `Release`, `Pages`, or `Publish container image` run.
- [ ] The Pages site at https://rgoshen.github.io/countdown-timer-ts/ is unchanged and still serving.

## Known Gaps

- `npm run ci` does not run `test:container-config` or `test:release-config`. Both config contract tests are invoked manually, matching the precedent set by the container test. Adding them to the `ci` script would also change when the container test runs, which is outside this plan's scope.
- The `commit-msg` hook is bypassable with `git commit --no-verify`. No continuous integration check backs it up; this was an accepted trade-off in the design.
- Enabling Dependabot version updates will open more pull requests than the current security-only default. The npm group setting collapses them into one pull request per ecosystem per week to limit the volume.
