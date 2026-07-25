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
