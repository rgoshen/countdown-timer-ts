# GHCR-backed Docker Compose Runtime Design

## Objective

Publish the countdown timer as a public multi-platform container image and make
`docker compose up` always pull the latest published `main` artifact for local
use at `http://localhost:8080`.

## Acceptance Criteria

- Pushes to `main` publish `ghcr.io/rgoshen/countdown-timer-ts:latest`.
- Each publication also creates an immutable `sha-<commit>` image tag.
- The image supports `linux/amd64` and `linux/arm64`.
- GitHub Actions uses `GITHUB_TOKEN`, least-privilege permissions, pinned action
  SHAs, OCI metadata, and a build-provenance attestation.
- `compose.yaml` contains no build configuration and always pulls `latest`.
- The Compose service publishes host port 8080 to nginx port 80 and reports
  HTTP health.
- A clean dependency install can run the repository CI script.
- Documentation distinguishes repository implementation from the one-time
  post-merge package publication and public-visibility steps.

## Architecture

GitHub Actions is the only image builder for the shared runtime. A workflow on
`main` uses QEMU and Buildx to build both supported Linux architectures, pushes
`latest` and commit tags to GHCR, and attests the pushed manifest digest.

Compose is only a consumer. Its single `app` service defaults to the GHCR
`latest` image, accepts an optional `IMAGE_TAG=sha-<commit>` rollback override,
sets `pull_policy: always`, maps `8080:80`, and retains the nginx root health
check. There are no source mounts, development servers, or local build
fallbacks.

## Publication Flow

1. A reviewed feature is merged into `main`.
2. GitHub Actions authenticates to GHCR with the repository `GITHUB_TOKEN`.
3. Buildx builds amd64 and arm64 variants from the existing Dockerfile.
4. GHCR receives `latest`, `sha-<commit>`, OCI labels, and provenance.
5. On the first publication only, the package owner changes visibility from
   private to public in GitHub package settings.
6. `docker compose up` anonymously pulls the current `latest` manifest and
   Docker selects the matching host architecture.

## Configuration Validation

A Node test renders Compose as JSON and asserts the exact image, always-pull
policy, lack of a local build, port mapping, and health command. The same test
parses the workflow with `yaml@2.9.0` and asserts triggers, permissions,
platforms, tags, attestation, and commit-pinned actions against the structured
configuration GitHub consumes.

The workflow YAML is also parsed by Prettier, the existing CI suite is run from
a clean dependency installation, and the Dockerfile is built and smoke-tested
locally. Anonymous GHCR pulling cannot be validated before the first publication
and public-visibility change, so it is an explicit post-merge acceptance step.

## Baseline Dependency Repair

The existing flat ESLint configuration imports four packages that are not
declared directly. A clean install proved three imports unavailable and lint
failed before any Docker change. Add exact, compatible direct development
dependencies without changing lint rules:

- `@eslint/js@9.33.0`
- `globals@16.3.0`
- `eslint-plugin-react-refresh@0.4.20`
- `typescript-eslint@8.39.0`

## Security and Supply Chain

The workflow grants package-write permission only to its publication job and
uses no personal access token. All actions are pinned to resolved commit SHAs.
The image is linked to its source through OCI labels and provenance. No secrets
are copied into the image, and `.dockerignore` excludes local environment files,
Git metadata, dependencies, generated output, logs, docs, and test scripts.

## Scope Boundaries

This feature does not add local image builds through Compose, hot reload, TLS,
deployment automation beyond GHCR publication, automated package-visibility
mutation, release-channel tags, or automatic merging.
