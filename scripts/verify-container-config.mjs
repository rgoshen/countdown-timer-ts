import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parse } from "yaml";

const image = "ghcr.io/rgoshen/countdown-timer-ts:latest";

test("Compose always pulls the GHCR image", () => {
  const rendered = execFileSync(
    "docker",
    ["compose", "config", "--format", "json"],
    {
      encoding: "utf8",
      env: { ...process.env, IMAGE_TAG: "" },
    },
  );
  const service = JSON.parse(rendered).services.app;

  assert.equal(service.image, image);
  assert.equal(service.pull_policy, "always");
  assert.equal(service.build, undefined);
  assert.equal(service.ports[0].published, "8080");
  assert.equal(service.ports[0].target, 80);
  assert.deepEqual(service.healthcheck.test, [
    "CMD",
    "wget",
    "-q",
    "-O",
    "/dev/null",
    "http://127.0.0.1/",
  ]);
});

test("GitHub Actions publishes a pinned multi-platform image", () => {
  const workflow = parse(
    readFileSync(".github/workflows/publish-container.yml", "utf8"),
  );
  const job = workflow.jobs.publish;
  const steps = new Map(job.steps.map((step) => [step.name, step]));

  assert.deepEqual(workflow.on.push.branches, ["main"]);
  assert.ok(Object.hasOwn(workflow.on, "workflow_dispatch"));
  assert.equal(workflow.env.REGISTRY, "ghcr.io");
  assert.equal(workflow.env.IMAGE_NAME, "${{ github.repository }}");
  assert.equal(job.if, "github.ref == 'refs/heads/main'");
  assert.deepEqual(job.permissions, {
    contents: "read",
    packages: "write",
    attestations: "write",
    "id-token": "write",
  });

  const expectedActions = new Map([
    ["Check out repository", "actions/checkout"],
    ["Set up QEMU", "docker/setup-qemu-action"],
    ["Set up Docker Buildx", "docker/setup-buildx-action"],
    ["Log in to GHCR", "docker/login-action"],
    ["Extract image metadata", "docker/metadata-action"],
    ["Build and push image", "docker/build-push-action"],
    ["Attest image provenance", "actions/attest"],
  ]);

  for (const [name, action] of expectedActions) {
    assert.match(steps.get(name).uses, new RegExp(`^${action}@[0-9a-f]{40}$`));
  }

  assert.equal(
    steps.get("Log in to GHCR").with.registry,
    "${{ env.REGISTRY }}",
  );
  assert.equal(
    steps.get("Log in to GHCR").with.username,
    "${{ github.actor }}",
  );
  assert.equal(
    steps.get("Log in to GHCR").with.password,
    "${{ secrets.GITHUB_TOKEN }}",
  );
  assert.deepEqual(
    steps.get("Extract image metadata").with.tags.trim().split("\n"),
    ["type=raw,value=latest", "type=sha,prefix=sha-"],
  );
  assert.equal(
    steps.get("Build and push image").with.platforms,
    "linux/amd64,linux/arm64",
  );
  assert.equal(steps.get("Build and push image").with.push, true);
  assert.equal(
    steps.get("Attest image provenance").with["push-to-registry"],
    true,
  );
});

test("the release job reports whether it released and which version", () => {
  const workflow = parse(readFileSync(".github/workflows/release.yml", "utf8"));

  assert.deepEqual(workflow.jobs.release.outputs, {
    released: "${{ steps.version.outputs.released }}",
    version: "${{ steps.version.outputs.version }}",
  });
});

test("the versioned image job only runs after a real release", () => {
  const workflow = parse(readFileSync(".github/workflows/release.yml", "utf8"));
  const job = workflow.jobs["publish-versioned-image"];

  assert.equal(job.needs, "release");
  assert.equal(job.if, "needs.release.outputs.released == 'true'");
});

test("the versioned image job checks out the release tag and publishes a pinned multi-platform image tagged only by version", () => {
  const workflow = parse(readFileSync(".github/workflows/release.yml", "utf8"));
  const job = workflow.jobs["publish-versioned-image"];
  const steps = new Map(job.steps.map((step) => [step.name, step]));

  assert.deepEqual(job.permissions, {
    contents: "read",
    packages: "write",
    attestations: "write",
    "id-token": "write",
  });
  assert.equal(job.env.REGISTRY, "ghcr.io");
  assert.equal(job.env.IMAGE_NAME, "${{ github.repository }}");

  assert.equal(
    steps.get("Check out release tag").with.ref,
    "v${{ needs.release.outputs.version }}",
  );

  const expectedActions = new Map([
    ["Check out release tag", "actions/checkout"],
    ["Set up QEMU", "docker/setup-qemu-action"],
    ["Set up Docker Buildx", "docker/setup-buildx-action"],
    ["Log in to GHCR", "docker/login-action"],
    ["Extract image metadata", "docker/metadata-action"],
    ["Build and push image", "docker/build-push-action"],
    ["Attest image provenance", "actions/attest"],
  ]);

  for (const [name, action] of expectedActions) {
    assert.match(steps.get(name).uses, new RegExp(`^${action}@[0-9a-f]{40}$`));
  }

  // Only the version tag here: publish-container.yml is the sole writer of
  // `latest`, since it already runs unconditionally on every push to main.
  // Writing `latest` from this job too would race that unsynchronized run.
  assert.deepEqual(
    steps.get("Extract image metadata").with.tags.trim().split("\n"),
    ["type=raw,value=${{ needs.release.outputs.version }}"],
  );
  assert.equal(
    steps.get("Build and push image").with.platforms,
    "linux/amd64,linux/arm64",
  );
  assert.equal(steps.get("Build and push image").with.push, true);
  assert.equal(
    steps.get("Attest image provenance").with["push-to-registry"],
    true,
  );
});
