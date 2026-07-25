import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parse } from "yaml";

const releaseConfig = JSON.parse(readFileSync(".releaserc.json", "utf8"));

const releaseWorkflow = parse(
  readFileSync(".github/workflows/release.yml", "utf8"),
);

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
  assert.equal(
    pluginOptions(findPlugin("@semantic-release/npm")).npmPublish,
    false,
  );
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
  assert.equal(
    pluginOptions(findPlugin("@semantic-release/commit-analyzer")).preset,
    undefined,
  );
  assert.equal(
    pluginOptions(findPlugin("@semantic-release/release-notes-generator"))
      .preset,
    undefined,
  );
});

test("documentation and refactor commits are visible in the changelog", () => {
  const visible = new Map(
    releaseConfig.presetConfig.types
      .filter((entry) => !entry.hidden)
      .map((entry) => [entry.type, entry.section]),
  );
  for (const type of [
    "feat",
    "fix",
    "perf",
    "revert",
    "refactor",
    "docs",
    "build",
    "ci",
  ]) {
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
    assert.match(
      step.uses,
      /@[0-9a-f]{40}$/,
      `${step.uses} must be SHA-pinned`,
    );
  }
});

const dependabot = parse(readFileSync(".github/dependabot.yml", "utf8"));

test("every dependabot ecosystem writes conventional commit messages", () => {
  const ecosystems = dependabot.updates.map(
    (update) => update["package-ecosystem"],
  );
  assert.deepEqual(ecosystems.sort(), ["github-actions", "npm"]);

  for (const update of dependabot.updates) {
    assert.equal(update["commit-message"].prefix, "chore(deps)");
  }
});

const pagesWorkflow = parse(
  readFileSync(".github/workflows/pages.yml", "utf8"),
);

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

test("the installed preset actually renders the configured sections", async () => {
  const { generateNotes } = await import(
    "@semantic-release/release-notes-generator"
  );
  const mk = (h, message) => ({
    hash: h,
    message,
    subject: message.split("\n")[0],
    body: "",
    committerDate: "2026-07-24",
    author: { name: "a" },
    committer: { name: "a" },
    tree: { long: h },
  });

  const notes = await generateNotes(
    { preset: releaseConfig.preset, presetConfig: releaseConfig.presetConfig },
    {
      commits: [
        mk("1".repeat(40), "feat: a visible feature"),
        mk("2".repeat(40), "fix: a visible fix"),
        mk("3".repeat(40), "chore: a hidden chore"),
        mk(
          "4".repeat(40),
          "feat: breaking change\n\nBREAKING CHANGE: the old api is gone",
        ),
      ],
      lastRelease: {},
      nextRelease: { version: "1.0.0", gitTag: "v1.0.0", channel: null },
      options: {
        repositoryUrl: "https://github.com/rgoshen/countdown-timer-ts",
      },
      cwd: process.cwd(),
      env: process.env,
    },
  );

  assert.match(notes, /### Features/);
  assert.match(notes, /a visible feature/);
  assert.match(notes, /### Bug Fixes/);
  assert.match(notes, /a visible fix/);
  assert.match(notes, /BREAKING CHANGES/);
  assert.doesNotMatch(notes, /a hidden chore/);
});

test("the pages workflow builds on the pinned node version", () => {
  const pagesSetupNode = pagesWorkflow.jobs.build.steps.find((step) =>
    step.uses?.startsWith("actions/setup-node@"),
  );
  assert.equal(pagesSetupNode.with["node-version-file"], ".nvmrc");
});

test("releases cannot run concurrently", () => {
  assert.equal(releaseWorkflow.concurrency.group, "release");
  assert.equal(releaseWorkflow.concurrency["cancel-in-progress"], false);
});
